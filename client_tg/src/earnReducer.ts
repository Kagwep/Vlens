// state/earnReducer.ts
import type { EarnState, EarnActionType } from './type';

export const initialEarnState: EarnState = {
    isLoading: false,
    error: null,
    transactionHash: null,
    positionInfo: null,
    currentRate: null,
    maxDeposit: null
};

export function earnReducer(
    state: EarnState, 
    action: EarnActionType
): EarnState {
    switch (action.type) {
        case 'LOADING_START':
            return {
                ...state,
                isLoading: true,
                error: null
            };

        case 'LOADING_END':
            return {
                ...state,
                isLoading: false
            };

        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                isLoading: false
            };

        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null
            };

        case 'SET_POSITION':
            return {
                ...state,
                positionInfo: action.payload
            };

        case 'SET_RATE':
            return {
                ...state,
                currentRate: action.payload
            };

        case 'SET_MAX_DEPOSIT':
            return {
                ...state,
                maxDeposit: action.payload
            };

        case 'SET_TRANSACTION_HASH':
            return {
                ...state,
                transactionHash: action.payload
            };

        case 'RESET_STATE':
            return initialEarnState;

        default:
            return state;
    }
}