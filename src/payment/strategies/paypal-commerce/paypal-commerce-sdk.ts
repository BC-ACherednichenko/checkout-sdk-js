
export interface ApproveDataOptions {
    orderID: string;
}

export interface ClickDataOptions {
    fundingSource: string;
}

export interface OrderData {
    orderId: string;
    approveUrl: string;
}

export enum StyleButtonLabel {
    paypal = 'paypal',
    checkout = 'checkout',
    buynow = 'buynow',
    pay = 'pay',
    installment = 'installment',
}

export enum StyleButtonLayout {
    vertical = 'vertical',
    horizontal = 'horizontal',
}

export enum StyleButtonColor {
    gold = 'gold',
    blue = 'blue',
    silver = 'silver',
    black = 'black',
    white = 'white',
}

export enum StyleButtonShape {
    pill = 'pill',
    rect = 'rect' ,
}

export interface PaypalButtonStyleOptions {
    layout?: StyleButtonLayout;
    color?: StyleButtonColor;
    shape?: StyleButtonShape;
    height?: 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55;
    label?: StyleButtonLabel;
    tagline?: boolean;
}

export interface ButtonsOptions {
    style?: PaypalButtonStyleOptions;
    fundingSource?: string;
    createOrder(): Promise<string>;
    onApprove(data: ApproveDataOptions): void;
    onClick(data: ClickDataOptions): void;
}

export interface PaypalCommerceSDK {
    FUNDING: {
        PAYPAL: string;
    };
    Buttons({createOrder, onApprove}: ButtonsOptions): {
        render(id: string): void;
    };
}

export interface PaypalCommerceHostWindow extends Window {
    paypal?: PaypalCommerceSDK;
}

export interface PaypalCommerceInitializationData {
    clientId: string;
    merchantId?: string;
    intent?: 'capture' | 'authorize';
    isPayPalCreditAvailable?: boolean;
    isProgressiveOnboardingAvailable?: boolean;
    clientToken?: string;
}

export type DisableFundingType = Array<'credit' | 'card'>;

export type ComponentsScriptType = Array<'buttons' | 'hosted-fields'>;

export interface PaypalCommerceScriptOptions {
    clientId: string;
    merchantId?: string;
    currency?: string;
    commit?: boolean;
    intent?: 'capture' | 'authorize';
    disableFunding?: DisableFundingType;
    components?: ComponentsScriptType;

}

export interface PaypalCommerceScriptAttribute {
    clientToken?: string;
    partnerAttributionId?: string;
}
