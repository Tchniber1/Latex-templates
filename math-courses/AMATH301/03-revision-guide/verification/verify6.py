from sympy import *
x,y,z,u,v,t,r,th,ph,rho=symbols('x y z u v t r theta phi rho',real=True)
I=integrate
print('A1',I(I(x**2*y,(y,-3,4)),(x,1,2)))
print('A2',I(I(x**2+y**2,(y,x**2,x)),(x,0,1)))
print('A3',simplify(I(I(exp(y**2),(x,0,y)),(y,0,1))))
A4=I(I(2*x*y,(y,0,x)),(x,0,1))+I(I(2*x*y,(y,0,2-x)),(x,1,2)); print('A4',A4, I(I(2*x*y,(y,0,x)),(x,0,1)), I(I(2*x*y,(y,0,2-x)),(x,1,2)))
print('A5',I(I(r**3,(r,0,1)),(th,0,2*pi)))
print('A6',simplify(I(I(r**3*cos(th)**2,(r,0,1-cos(th))),(th,0,2*pi))))
print('A7',simplify(I(I(I(rho**2*sin(ph),(rho,0,1)),(ph,0,pi/4)),(th,0,2*pi))))
print('A8',I(I(r*cos(th)*r,(r,0,1)),(th,0,pi/2))/(pi/4), I(I(I(rho*cos(ph)*rho**2*sin(ph),(rho,0,1)),(ph,0,pi/2)),(th,0,pi/2))/(pi/6))
print('A9',I(I(I(1,(z,0,1-x-y)),(y,0,1-x)),(x,0,1)), I(I(I(x,(z,0,1-x-y)),(y,0,1-x)),(x,0,1)))
print('A10',simplify(I(I(exp(-r**2)*r,(r,0,2)),(th,0,2*pi))))
print('A11 quarter disc xy r=2',I(I(r**3*cos(th)*sin(th),(r,0,2)),(th,0,pi/2)))
M=lambda *rows: Matrix(rows)
print('B1',M([3,1],[2,-5]).det(),'B2',M([1,3],[2,-1]).det(),'B4',M([3,1,2],[1,-1,4],[2,1,0]).det(),'B5',M([3,0,1],[1,2,5],[-1,4,2]).det(),'B7',M([3,1,4],[-1,2,1],[5,-2,1]).det())
print('B6',simplify(I(I(exp(4*u)*cos(v)**2,(v,0,pi)),(u,0,1))))
# u=x+y,v=x-y over |x|+|y|<=1 of (x+y)^2
print('B8 direct', I(I((x+y)**2,(y,-(1-abs(x)),1-abs(x))),(x,-1,1)) if False else None)
print('B8', I(I(u**2*Rational(1,2),(u,-1,1)),(v,-1,1)))
# numeric check of B8
import itertools
from sympy import Piecewise
val=I(I((x+y)**2,(y,-(1+x),1+x)),(x,-1,0))+I(I((x+y)**2,(y,-(1-x),1-x)),(x,0,1)); print('B8 direct',simplify(val))
# Mock
f=x*y**2/(x**2+y**2); print('M1', limit(f.subs({x:t,y:t})/sqrt(2*t**2),t,0,'+'))
f=x**2*y-y**3+2*x; g=[diff(f,x),diff(f,y)]; P={x:1,y:2}; G=[e.subs(P) for e in g]; print('M2 grad',G, f.subs(P), (G[0]*3+G[1]*4)/5, sqrt(G[0]**2+G[1]**2))
X=(exp(t),2+sin(t)); print('M2 chain', diff(f.subs({x:X[0],y:X[1]}),t).subs(t,0))
f=exp(x)*log(1+y); s=series(f.subs({x:t*x,y:t*y}),t,0,3).removeO().subs(t,1); print('M3', expand(s), diff(f,x,y).subs({x:0,y:0}))
print('M3 op', expand(diff(x**3*y,x,2)-2*diff(x**3*y,x,y)+diff(x**3*y,y,2)))
f=x**3+y**3-3*x-12*y+20; print('M4', solve([diff(f,x),diff(f,y)],[x,y],dict=True), [f.subs(p) for p in [{x:1,y:2},{x:-1,y:-2},{x:1,y:-2},{x:-1,y:2}]])
g=x**2+y**2-2*x+4*y; print('M4b', g.subs({x:1,y:-2}), g.subs({x:-2,y:4}))
lam=symbols('lam'); print('M5', solve([y*z-lam,x*z-2*lam,x*y-3*lam,x+2*y+3*z-18],[x,y,z,lam],dict=True))
F=Matrix([x**2-y**2,2*x*y]); J=F.jacobian([x,y]); print('M6', simplify(J.det()), J.subs({x:1,y:1}).inv())
f=exp(x*y)+x+y**2-2; print('M6b', f.subs({x:0,y:1}), (-diff(f,x)/diff(f,y)).subs({x:0,y:1}))
