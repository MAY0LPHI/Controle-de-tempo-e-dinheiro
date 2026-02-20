const DEFAULT_STATE = {
    onboarded: false,
    settings: {
        salary: 0,
        hours: 0,
        hourlyRate: 0
    },
    challengeSettings: {
        targetGoal: 5050,
        strategy: 'more_envelopes', 
        envelopeValues: Array.from({ length: 100 }, (_, i) => i + 1)
    },
    decisions: [],
    waitingItems: [],
    envelopes: Array(100).fill(false)
};

export const Storage = {
    save: (state) => {
        localStorage.setItem('cuanto_custa_v2_data', JSON.stringify(state));
    },
    load: () => {
        const data = localStorage.getItem('cuanto_custa_v2_data');
        if (!data) return DEFAULT_STATE;
        try {
            return { ...DEFAULT_STATE, ...JSON.parse(data) };
        } catch (e) {
            return DEFAULT_STATE;
        }
    },
    clear: () => {
        localStorage.removeItem('cuanto_custa_v2_data');
    }
};

export let AppState = Storage.load();

export function updateState(key, value) {
    AppState[key] = value;
    Storage.save(AppState);
}

export function resetState() {
    Storage.clear();
    AppState = JSON.parse(JSON.stringify(DEFAULT_STATE));
}
