import sympy as sp
x,y,z,t,u,v,a,b,r,th=sp.symbols('x y z t u v a b r theta',real=True)
f=x**2*y/(x**4+y**2)
print('E1 y=mx', sp.limit(f.subs(y,a*x),x,0), 'y=x^2', sp.simplify(f.subs(y,x**2)))
print('E1 DAf', sp.limit(f.subs({x:t*a,y:t*b})/t,t,0))
F=x*sp.exp(y*z); P={x:2,y:0,z:1}
g=[F.diff(s).subs(P) for s in (x,y,z)]; print('E2 grad',g, 'D', sum(gi*d for gi,d in zip(g,[sp.Rational(2,3),sp.Rational(1,3),sp.Rational(2,3)])), sp.sqrt(sum(gi**2 for gi in g)))
G=((u+v)**2*u*v); print('E2c', G.diff(u).subs({u:1,v:1}))
h=sp.exp(x)*sp.cos(y); print('E3', sp.series(sp.exp(x),x,0,3).removeO()*sp.series(sp.cos(y),y,0,3).removeO(), sp.N(sp.exp(0.1)*sp.cos(0.2),7), sp.simplify(h.diff(x,2)+h.diff(y,2)), (h.diff(x,2)+2*h.diff(x,y)+h.diff(y,2)).subs({x:0,y:0}))
q=x**3-3*x+y**2-2*y; print('E4 crit',sp.solve([q.diff(x),q.diff(y)],[x,y]), [q.subs(p) for p in [{x:1,y:1},{x:-1,y:1}]])
vals={}
for X in [0,1,2]:
  for Y in [0,1,2]: vals[(X,Y)]=q.subs({x:X,y:Y})
print('E4 grid',vals)
import numpy as np
xs=np.linspace(0,2,401);XX,YY=np.meshgrid(xs,xs);Q=XX**3-3*XX+YY**2-2*YY;print('numeric',Q.min(),Q.max())
lam=sp.symbols('lam'); print('E5', sp.solve([1-lam*2*x,2-lam*8*y,x**2+4*y**2-8],[x,y,lam]))
print('E5b', sp.solve([4*y-lam*2*x/9,4*x-lam*2*y/4,x**2/9+y**2/4-1],[x,y,lam]))
J=sp.Matrix([x+y,x**2-y]).jacobian([x,y]); print('E6', J.det(), J.subs({x:1,y:1}).inv())
E=x**2+y*z+z**3-3; print('E6b', E.subs({x:1,y:1,z:1}), -E.diff(x)/E.diff(z), (-E.diff(x)/E.diff(z)).subs({x:1,y:1,z:1}), (-E.diff(y)/E.diff(z)).subs({x:1,y:1,z:1}))
print('Bonus', sp.integrate(sp.exp(r**2)*r,(r,0,1))*2*sp.pi, sp.integrate(sp.integrate(sp.sin(y**2),(x,0,y)),(y,0,1)))
w=x**2+y**2*(1-x)**3; print('QC unique', sp.solve([w.diff(x),w.diff(y)],[x,y]), w.subs({x:4,y:1}))
print('exy', sp.expand(sp.series(sp.exp(x+y).subs({x:t*x,y:t*y}),t,0,3).removeO().subs(t,1)))
