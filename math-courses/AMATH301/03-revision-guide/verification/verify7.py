from sympy import *
x,y,z,t,h,k,lam=symbols('x y z t h k lam',real=True)
f=(x**3+y**3)/(x**2+y**2)
print('E1 R along h=k', simplify((f.subs({x:t,y:t})-t-t)/sqrt(2*t**2)))
f=x**2+y**2-x; print('disc', solve([diff(f,x),diff(f,y)]), f.subs({x:Rational(1,2),y:0}))
th=symbols('th'); print([f.subs({x:cos(th),y:sin(th)}).subs(th,a) for a in [0,pi]])
f=x**4+y**4-4*x*y; print(solve([diff(f,x),diff(f,y)],[x,y],dict=True)[:5], f.subs({x:1,y:1}))
print('plane', solve([2*x-lam,2*y-2*lam,2*z-2*lam,x+2*y+2*z-9],[x,y,z,lam]))
print('box', solve([y*z-lam*(y+2*z),x*z-lam*(x+2*z),x*y-lam*(2*x+2*y),x*y+2*x*z+2*y*z-12],[x,y,z,lam],dict=True))
g=log(x**2+y**2); print('tp', g.subs({x:1,y:0}), diff(g,x).subs({x:1,y:0}), diff(g,y).subs({x:1,y:0}))
# Taylor sqrt(x^2+y^3) at (1,2)
f=sqrt(x**2+y**3); T=(f+diff(f,x)*h+diff(f,y)*k+Rational(1,2)*(diff(f,x,2)*h**2+2*diff(f,x,y)*h*k+diff(f,y,2)*k**2)).subs({x:1,y:2})
print('T2',expand(T), N(T.subs({h:0.02,k:-0.03}),10), N(f.subs({x:1.02,y:1.97}),10))
# chain rule g(t,x,y)=f(t^2 x, t y) symbolic ok
# directional on hill h=100-x^2-2y^2 at (2,1)
H=100-x**2-2*y**2; G=[diff(H,x).subs({x:2,y:1}),diff(H,y).subs({x:2,y:1})]; print('hill',G,sqrt(G[0]**2+G[1]**2))
# Laplace ln r etc fine. Hyperboloid lagrange slides
f=x**2+y**2+z**2; g=x**2+2*y**2-z**2-1
print('hyp', solve([2*x-lam*2*x,2*y-lam*4*y,2*z+lam*2*z,g],[x,y,z,lam],dict=True))
# spherical Jacobian
r,p,q=symbols('rho phi theta',positive=True)
F=Matrix([r*sin(p)*cos(q),r*sin(p)*sin(q),r*cos(p)]); print('sph',simplify(F.jacobian([r,p,q]).det()))
# robot arm
a,b,L1,L2=symbols('a b L1 L2'); F=Matrix([L1*cos(a)+L2*cos(a+b),L1*sin(a)+L2*sin(a+b)]); print('arm',simplify(F.jacobian([a,b]).det()))
