/** 해시 라우터: (없음) 입력 · #dive-<token> 연출+결과 */
export type Route = { name: 'input' } | { name: 'dive'; token: string };

function parse(hash: string): Route {
  const m = hash.match(/^#dive-([0-9a-f]+)$/);
  return m ? { name: 'dive', token: m[1] } : { name: 'input' };
}

class Router {
  route = $state<Route>(parse(location.hash));

  constructor() {
    addEventListener('hashchange', () => {
      this.route = parse(location.hash);
      scrollTo(0, 0);
    });
  }

  go(hash: string) {
    if (location.hash === hash) this.route = parse(hash);
    else location.hash = hash;
  }
}

export const router = new Router();
