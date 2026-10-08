export class HomeApiException extends Error {

    private errorCode: number;
    private httpStatusCode: number;

    constructor({message, errorCode, httpStatusCode}: { message: string, errorCode?: number, httpStatusCode?: number }) {
        super(message);

        this.errorCode = errorCode || null;
        this.httpStatusCode = httpStatusCode ||null;

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HomeApiException.prototype);
    }

    getErrorCode() {
        return this.errorCode;
    }

    getHttpStatusCode() {
        return this.httpStatusCode || 500;
    }
}