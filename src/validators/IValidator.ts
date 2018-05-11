export default interface IValidator<T> {
  validateCreate(bodyData: T);
  validateUpdate(dataId: number, newData: T);
}