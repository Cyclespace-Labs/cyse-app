import { Wallet } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full h-full p-20 flex flex-col">
          <div className="mb-8">
            <h1 className="text-4xl font-bold"></h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">Trade cryptocurrencies with ease</p>
          </div>
          <button className="bg-blue-500 w-fit text-white px-4 py-2 rounded-md" title="Connect Wallet">
            <Link href="/trading">
              Open App
            </Link>
          </button>
        </div>
      </main>
    </div>
  );
}
