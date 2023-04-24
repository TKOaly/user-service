export type OAuthErrorCode =
  | 'invalid_request'
  | 'unauthorized_client'
  | 'access_denied'
  | 'unsupported_response_type'
  | 'invalid_scope'
  | 'server_error'
  | 'temporarily_unavailable';

const ERROR_STATUS_CODES: { [key in OAuthErrorCode]: number } = {
  'invalid_request': 400,
  'unauthorized_client': 401,
  'access_denied': 403,
  'unsupported_response_type': 400,
  'invalid_scope': 400,
  'server_error': 500,
  'temporarily_unavailable': 503,
};

interface OAuthErrorOptions {
  code: OAuthErrorCode
  description?: string
  uri?: string
  state?: string
}

export class OAuthError extends Error {
  public options: OAuthErrorOptions;

  constructor(param: OAuthErrorCode | OAuthErrorOptions) {
    let options;

    if (typeof param === 'string') {
      options = { code: param };
    } else {
      options = param;
    }

    super(options.code);

    this.options = options;
  }

  withState(state: string | null) {
    return new OAuthError({
      ...this.options,
      state: state ?? undefined,
    })
  } 

  withDescription(description: string) {
    return new OAuthError({
      ...this.options,
      description,
    })
  }

  withCode(code: OAuthErrorCode) {
    return new OAuthError({
      ...this.options,
      code,
    });
  }

  get statusCode() {
    return ERROR_STATUS_CODES[this.options.code] ?? 500; 
  }
}

