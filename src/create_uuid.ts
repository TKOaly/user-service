/**
 * Helper file to create random UUIDs.
 */

import * as uuidv4 from "uuid/v4";

console.log("10 UUID's generated below\r\n");

for (let i = 0; i < 10; i++) {
  console.log(uuidv4() + "\r\r");
}
