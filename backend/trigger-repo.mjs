import http from 'http';
import fs from 'fs';

async function testRepo() {
    console.log("Testing POST /repositories...");
    try {
        const res = await fetch("http://localhost:4000/api/v1/repositories", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Using a dummy user for the request
                "x-user-id": "test-user-id"
            },
            body: JSON.stringify({
                name: "test-repo-" + Date.now(),
                description: "Test repo to verify localhost removal",
                isPublic: false,
                techStack: "TypeScript"
            })
        });

        if (!res.ok) {
            console.error("Failed:", res.status, await res.text());
            return;
        }

        const data = await res.json();
        console.log("Success:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

testRepo();
