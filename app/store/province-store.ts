import { create } from "zustand";

export interface Province {
    id: number;
    country_id: number;
    zone_id: number;
    province_name: string;
    created_at: string;
}

interface ProvinceStore {
    provinces: Province[];
    setProvinces: (provinces: Province[]) => void;
    getProvinceById: (id: number) => Province | undefined;
}

export const useProvinceStore = create<ProvinceStore>((set, get) => ({
    provinces: [],

    setProvinces: (provinces) => {
        set({ provinces });
    },

    getProvinceById: (id) => {
        return get().provinces.find((province) => province.id === id);
    },
}));
