/**
 * Helper file to create random UUIDs.
 */

import { v4 as uuidv4 } from "uuid";

console.log("10 UUID's generated below\r\n");

for (let i = 0; i < 10; i++) {
  console.log(uuidv4() + "\r\r");
}
