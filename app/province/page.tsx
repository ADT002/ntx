"use client";

import React, { useEffect } from "react";
import { useProvinceStore } from "../store/province-store";

function Province() {
    const provinces = useProvinceStore((state) => state.provinces);
    const setProvinces = useProvinceStore((state) => state.setProvinces);

    useEffect(() => {
        async function getProvinces() {
            const res = await fetch("/api/province");
            const result = await res.json();

            if (result.success) {
                setProvinces(result.data);
            }
        }

        // Chỉ gọi API nếu chưa có data
        if (provinces.length === 0) {
            getProvinces();
        }
    }, [provinces.length, setProvinces]);

    return (
        <div>
            <h1>Province</h1>

            {provinces.map((province) => (
                <div key={province.id}>
                    {province.id} - {province.province_name}
                </div>
            ))}
        </div>
    );
}

export default Province;
