import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function test() {
  try {
    const count = await p.user.count();
    console.log("SUCCESS - user count:", count);
  } catch (e) {
    console.log("ERROR_TYPE:", (e as any).constructor.name);
    console.log("ERROR_MSG:", (e as any).message);
    console.log("ERROR_CODE:", (e as any).errorCode);
  } finally {
    await p.$disconnect();
  }
}

test();
