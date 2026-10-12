"use client";

import React, { useEffect, useState } from "react";

function District() {
    const [data, setData] = useState(null);

    useEffect(() => {
        async function getDistricts() {
            const res = await fetch("/api/district?province_id=50");
            const result = await res.json();

            console.log(result);
            setData(result);
        }

        getDistricts();
    }, []);

    return (
        <div>
            <h1>District API Response</h1>

            <pre>
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}

export default District;
