import { noop } from 'lodash';
import { Cart } from '../../../cart';
import { CheckoutStore, InternalCheckoutSelectors } from '../../../checkout';
import { OrderActionCreator, OrderRequestBody } from '../../../order';
import { OrderFinalizationNotRequiredError } from '../../../order/errors';
import { PaymentArgumentInvalidError } from '../../errors';
import PaymentActionCreator from '../../payment-action-creator';
import PaymentMethodActionCreator from '../../payment-method-action-creator';
import { PaymentInitializeOptions, PaymentRequestOptions } from '../../payment-request-options';
import PaymentStrategyActionCreator from '../../payment-strategy-action-creator';
import PaymentStrategy from '../payment-strategy';

import {    ButtonsOptions,
    PaypalCommerceInitializationData,
    PaypalCommercePaymentProcessor,
    PaypalCommerceRequestSender, PaypalCommerceScriptOptions } from './index';
import PaypalCommerceScriptLoader from './paypal-commerce-script-loader';

export default class PaypalCommercePaymentStrategy implements PaymentStrategy {
    private _methodId?: string;
    constructor(
        private _store: CheckoutStore,
        private _orderActionCreator: OrderActionCreator,
        private _paymentActionCreator: PaymentActionCreator,
        private _paypalCommerceRequestSender: PaypalCommerceRequestSender,
        private _paypalCommercePaymentProcessor: PaypalCommercePaymentProcessor,
        private _paypalScriptLoader: PaypalCommerceScriptLoader,
        private _paymentMethodActionCreator: PaymentMethodActionCreator,
        private _paymentStrategyActionCreator: PaymentStrategyActionCreator
    ) {}

    async initialize(options: PaymentInitializeOptions): Promise<InternalCheckoutSelectors> {
        this._methodId = options.methodId;
        const state = await this._store.dispatch(this._paymentMethodActionCreator.loadPaymentMethod(options.methodId));
        const paymentMethod = state.paymentMethods.getPaymentMethodOrThrow(options.methodId);

        const cart = state.cart.getCartOrThrow();

        const paramsScript = {
            options: this._getOptionsScript(paymentMethod.initializationData, cart),
            attr: { },
        };
        const paypal = await this._paypalScriptLoader.loadPaypalCommerce(paramsScript, true);
        // @ts-ignore
        const buttonParams: ButtonsOptions = {
            fundingSource: paypal.FUNDING.PAYPAL,
            onClick: () => {},
            createOrder: () => this._setupPayment(cart.id),
            onApprove: () => { paymentMethod.nonce = '112312';}, // TODO handle order creation instead place order button, allow place order button
        };
        // TODO check if method avaialble
        // @ts-ignore
        paypal.Buttons(buttonParams).render(options.paypalcommerce?.container);
        this._showLoadingSpinner(() => new Promise(noop));

        return this._store.getState();
    }

    async execute(payload: OrderRequestBody, options: PaymentRequestOptions): Promise<InternalCheckoutSelectors> {
        const { payment, ...order } = payload;
        const state = this._store.getState();
        const paymentMethod = state.paymentMethods.getPaymentMethodOrThrow(options.methodId);

        if (!payment) {
            throw new PaymentArgumentInvalidError(['payment']);
        }

        const orderId = paymentMethod.initializationData.orderId || await this._getOrderId(options.methodId);

        const paymentData =  {
            formattedPayload: {
                vault_payment_instrument: null,
                set_as_default_stored_instrument: null,
                device_info: null,
                paypal_account: {
                    order_id: orderId,
                },
            },
        };

        await this._store.dispatch(this._orderActionCreator.submitOrder(order, options));

        return this._store.dispatch(this._paymentActionCreator.submitPayment({ ...payment, paymentData }));
    }

    finalize(): Promise<InternalCheckoutSelectors> {
        return Promise.reject(new OrderFinalizationNotRequiredError());
    }

    deinitialize(): Promise<InternalCheckoutSelectors> {
        this._paypalCommercePaymentProcessor.deinitialize();

        return Promise.resolve(this._store.getState());
    }

    private _showLoadingSpinner(callback?: () => Promise<void> | Promise<never>): Promise<InternalCheckoutSelectors> {
        return this._store.dispatch(this._paymentStrategyActionCreator.widgetBlocksTheSubmitButton(() => {

            if (callback) {
                return callback();
            }

            return Promise.reject();
        }, { methodId: this._methodId }));
    }

    private async _getOrderId(methodId: string): Promise<string> {
        const state = this._store.getState();
        const cart = state.cart.getCartOrThrow();
        const provider = methodId === 'paypalcommercecredit' ? 'paypalcommercecreditcheckout' : 'paypalcommercecheckout';
        const { orderId } = await this._paypalCommerceRequestSender.setupPayment(provider, cart.id);

        return orderId;
    }

    private async _setupPayment(cartId: string): Promise<string> {
        const { orderId } = await this._paypalCommerceRequestSender.setupPayment('paypalcommercecheckout', cartId);

        return orderId;
    }

    private _getOptionsScript(initializationData: PaypalCommerceInitializationData, cart: Cart): PaypalCommerceScriptOptions {
        // TODO rebuild initialisation according to initialisation of each particular payment method
        const { clientId, intent, merchantId } = initializationData;

        return {
            clientId,
            merchantId,
            commit: false,
            currency: cart.currency.code,
            intent,
        };
    }
}
