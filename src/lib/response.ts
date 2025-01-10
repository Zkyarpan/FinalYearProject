export interface SuccessResponse<T> {
  StatusCode: number;
  IsSuccess: true;
  ErrorMessage: [];
  Result: T;
}

export interface ErrorResponse {
  StatusCode: number;
  IsSuccess: false;
  ErrorMessage: {
    message: string;
    errorStack?: string;
  }[];
  Result: null;
}

export const createSuccessResponse = <T>(
  statusCode: number,
  result: T
): SuccessResponse<T> => {
  return {
    StatusCode: statusCode,
    IsSuccess: true,
    ErrorMessage: [],
    Result: result,
  };
};

export const createErrorResponse = (
  statusCode: number,
  errorMessage: string,
  errorStack: string = ''
): ErrorResponse => {
  return {
    StatusCode: statusCode,
    IsSuccess: false,
    ErrorMessage: [
      {
        message: errorMessage,
        errorStack: errorStack || undefined,
      },
    ],
    Result: null,
  };
};
