export class NextResponse extends Response {
  public cookies: {
    set: (name: string, value: string, options?: any) => void;
    get: (name: string) => any;
    delete: (name: string) => void;
  };
  public _cachedBody?: string;

  constructor(body?: any, init?: ResponseInit) {
    super(body, init);
    const headers = this.headers;
    this.cookies = {
      set: (name: string, value: string, options?: any) => {
        let cookieStr = `${name}=${encodeURIComponent(value)}; Path=${options?.path || "/"}`;
        if (options?.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;
        if (options?.httpOnly) cookieStr += "; HttpOnly";
        if (options?.secure) cookieStr += "; Secure";
        if (options?.sameSite) cookieStr += `; SameSite=${options.sameSite}`;
        headers.append("Set-Cookie", cookieStr);
      },
      get: () => undefined,
      delete: (name: string) => {
        headers.append("Set-Cookie", `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
      },
    };
  }

  static json(body: any, init?: ResponseInit) {
    const headers = new Headers(init?.headers);
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json; charset=utf-8");
    }
    const jsonString = JSON.stringify(body);
    const res = new NextResponse(jsonString, {
      status: init?.status || 200,
      statusText: init?.statusText,
      headers,
    });
    res._cachedBody = jsonString;
    return res;
  }

  static redirect(url: string | URL, init?: number | ResponseInit) {
    const status = typeof init === "number" ? init : init?.status || 307;
    return new NextResponse(null, {
      status,
      headers: { Location: url.toString() },
    });
  }

  static next(init?: ResponseInit) {
    return new NextResponse(null, init);
  }
}

export type NextRequest = any;
