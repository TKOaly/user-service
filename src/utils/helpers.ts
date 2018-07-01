export const stringToBoolean: (str: any) => boolean = str => {
  return str === "0"
  ? false
  : str === "false"
  ? false
  : str === "1"
  ? true
  : str === "true"
  ? true
  : false 
}