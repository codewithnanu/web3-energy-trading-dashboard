// PURPOSE: All IPFS operations go through this file
// uploadToIPFS  → uploads JSON data to Pinata, returns the hash
// fetchFromIPFS → reads JSON data from IPFS using a hash

import axios from "axios";
import { PINATA_JWT, PINATA_GATEWAY } from "./config";

// uploadToIPFS — takes any JavaScript object, uploads it to IPFS via Pinata
// Returns the IPFS hash (CID) which we then store on blockchain
// Example: uploadToIPFS({ name: "Greenview", location: "Downtown" })
// Returns: "QmXyz123..."
export async function uploadToIPFS(data) {
  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        pinataContent: data,
        pinataMetadata: { name: "enerchain-data" },
      },
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          "Content-Type": "application/json",
        },
      }
    );

    // IpfsHash is the hash returned by Pinata after successful upload
    return response.data.IpfsHash;

  } catch (error) {
    console.error("IPFS upload failed:", error);
    throw new Error("Failed to upload data to IPFS");
  }
}

// fetchFromIPFS — takes an IPFS hash, fetches and returns the JSON data
// Example: fetchFromIPFS("QmXyz123...")
// Returns: { name: "Greenview", location: "Downtown", ... }
export async function fetchFromIPFS(ipfsHash) {
  try {
    const response = await axios.get(`${PINATA_GATEWAY}${ipfsHash}`);
    return response.data;
  } catch (error) {
    console.error("IPFS fetch failed:", error);
    throw new Error("Failed to fetch data from IPFS");
  }
}
