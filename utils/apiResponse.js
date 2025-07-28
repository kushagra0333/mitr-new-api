export default class ApiResponse {
  constructor(res, statusCode, data) {
    this.res = res;
    this.statusCode = statusCode;
    this.data = data;
    this.send();
  }

  send() {
    this.res.status(this.statusCode).json({
      status: 'success',
      ...this.data
    });
  }
}