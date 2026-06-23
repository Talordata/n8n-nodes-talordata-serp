import type { INodeProperties } from 'n8n-workflow';
export interface GeneratedSerpParameter {
    key: string;
    propertyName: string;
    type: 'string' | 'number' | 'boolean' | 'options' | 'json';
    required: boolean;
}
export interface GeneratedSerpAction {
    toolName: string;
    engine: string;
    label: string;
    queryField: string;
    resultType: 'web' | 'image' | 'raw';
    source: string;
    parameters: GeneratedSerpParameter[];
}
export declare const SERP_ACTIONS: GeneratedSerpAction[];
export declare const SERP_ACTION_OPTIONS: Array<{
    name: string;
    value: string;
}>;
export declare const SERP_ACTION_PROPERTIES: INodeProperties[];
export declare const SERP_ACTIONS_BY_TOOL_NAME: Record<string, GeneratedSerpAction>;
