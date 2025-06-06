#!/usr/bin/env node

import { createClient } from "redis";
import { env } from "../src/env.js";

/**
 * Script to clear rate limits for a specific IP address
 * Usage: yarn clear-rate-limits [ip-address]
 * If no IP is provided, defaults to 127.0.0.1
 */

async function clearRateLimits() {
  // Get IP from command line args, default to localhost
  const targetIp = process.argv[2] || "127.0.0.1";

  console.log(`🧹 Clearing rate limits for IP: ${targetIp}`);

  try {
    // Connect to Redis using the same configuration as the rate limiter
    const redisUrl =
      env.REDIS_URL ?? "redis://:devredispassword@localhost:6379";
    console.log(`📡 Connecting to Redis...`);

    const client = createClient({ url: redisUrl });

    client.on("error", (err) => {
      console.error("❌ Redis connection error:", err);
      process.exit(1);
    });

    await client.connect();
    console.log("✅ Connected to Redis");

    // Rate limit key patterns to search for
    const keyPatterns = [
      `auth_rate_limit*`, // Auth rate limits (broader pattern)
      `api_rate_limit*`, // API rate limits (broader pattern)
      `custom_rate_limit*`, // Custom rate limits (broader pattern)
    ];

    let totalKeysCleared = 0;

    for (const pattern of keyPatterns) {
      console.log(`🔍 Searching for keys matching: ${pattern}`);

      // Get all keys matching the pattern
      const keys = await client.keys(pattern);

      if (keys.length === 0) {
        console.log(`   No keys found for pattern: ${pattern}`);
        continue;
      }

      // Filter keys that contain the target IP
      const isLocalhost =
        targetIp === "127.0.0.1" ||
        targetIp === "::1" ||
        targetIp === "localhost";

      const ipKeys = keys.filter((key) => {
        // For localhost, clear all rate limit keys since development typically uses localhost
        if (isLocalhost) {
          return true; // Clear all rate limit keys for localhost
        }

        // For other IPs, check if the key contains the IP in various formats
        return (
          key.includes(targetIp) ||
          key.includes(targetIp.replace(/\./g, "_")) || // IP with underscores
          key.includes(targetIp.replace(/\./g, "-"))
        ); // IP with dashes
      });

      if (ipKeys.length > 0) {
        console.log(`   Found ${ipKeys.length} keys for IP ${targetIp}:`);
        ipKeys.forEach((key) => console.log(`     - ${key}`));

        // Delete all matching keys
        await client.del(ipKeys);
        totalKeysCleared += ipKeys.length;
        console.log(`   ✅ Deleted ${ipKeys.length} keys`);
      } else {
        console.log(
          `   No keys found for IP ${targetIp} in pattern: ${pattern}`,
        );
      }
    }

    // Also clear any keys that might have the IP in a different format
    // Express-rate-limit might use IP as part of compound keys
    console.log(`🔍 Searching for any remaining IP-related keys...`);
    const allKeys = await client.keys("*");
    const remainingIpKeys = allKeys.filter((key) =>
      key.toLowerCase().includes(targetIp.toLowerCase()),
    );

    if (remainingIpKeys.length > 0) {
      console.log(
        `   Found ${remainingIpKeys.length} additional IP-related keys:`,
      );
      remainingIpKeys.forEach((key) => console.log(`     - ${key}`));

      await client.del(remainingIpKeys);
      totalKeysCleared += remainingIpKeys.length;
      console.log(`   ✅ Deleted ${remainingIpKeys.length} additional keys`);
    }

    await client.disconnect();

    if (totalKeysCleared > 0) {
      console.log(
        `\n🎉 Successfully cleared ${totalKeysCleared} rate limit keys for IP: ${targetIp}`,
      );
      console.log(
        `   The IP can now make fresh requests without rate limiting.`,
      );
    } else {
      console.log(`\n💡 No rate limit keys found for IP: ${targetIp}`);
      console.log(
        `   The IP was not rate limited or keys may have already expired.`,
      );
    }
  } catch (error) {
    console.error("❌ Error clearing rate limits:", error);
    process.exit(1);
  }
}

// Run the script
clearRateLimits().catch(console.error);
