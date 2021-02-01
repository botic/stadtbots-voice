export enum MatomoService {
    Alexa = "Alexa",
}

export enum MatomoCustomVariableScope {
    visit = "visit",
    page = "page",
}

export interface MatomoCustomVariable {
    name: string;
    value: string;
    scope: MatomoCustomVariableScope;
}

export interface MatomoTrackingEvent {
    customVariables: MatomoCustomVariable[];
    category: string;
    action: string;
    name?: string;
    value?: string;
}
