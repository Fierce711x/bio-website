export type ErrorResponse = {
  statusCode: number;
  message:
    | string
    | {
        property: string;
        reason: string[];
      }[];
  error: string;
};
