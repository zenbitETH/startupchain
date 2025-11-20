// import { NextResponse } from "next/server"
// import { startupChainClient } from "@/lib/blockchain/startupchain-client"
// import StartupChainAbi from "@/lib/abis/StartupChain.json"

// export async function POST(req: Request) {
//   const { ensName, founders } = await req.json()

//   if (!ensName || !Array.isArray(founders) || founders.length === 0) {
//     return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
//   }

//   const txHash = await startupChainClient.writeContract({
//     address: process.env.STARTUPCHAIN_ADDRESS as `0x${string}`,
//     abi: StartupChainAbi,
//     functionName: "registerCompany",
//     args: [ensName, founders],
//   })

//   return NextResponse.json({ txHash })
// }
