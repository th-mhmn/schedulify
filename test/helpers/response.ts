export function expectSuccessResponse<T>(body: any, data: T) {
  expect(body).toMatchObject({
    message: 'Success',
    data,
  });
}
