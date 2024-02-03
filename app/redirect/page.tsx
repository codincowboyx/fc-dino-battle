'use client';
import {useRouter} from "next/navigation";
import {useEffect} from "react";

export default function RedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.push("/");
    }, [router]);

    return (
        <div>
            <p>Redirecting...</p>
        </div>
    );
}