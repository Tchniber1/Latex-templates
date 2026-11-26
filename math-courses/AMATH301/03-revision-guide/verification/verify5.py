from sympy import *
x,y,z,u,v,t,h,k,r,th,mu=symbols('x y z u v t h k r theta mu',real=True)
# P5.2 derivative from def F=(xy, x-y^2) at (2,1)
F=Matrix([x*y,x-y**2]); P={x:2,y:1}
diffF=expand(F.subs({x:2+h,y:1+k})-F.subs(P)); print('5.2',diffF.T, F.jacobian([x,y]).subs(P))
# P5.3 chain rule: F(x,y)=(x^2-y, xy), G(u,v)=(e^u, u+v^2) at (1,1)
F=Matrix([x**2-y,x*y]); G=Matrix([exp(u),u+v**2])
JF=F.jacobian([x,y]).subs({x:1,y:1}); Fp=F.subs({x:1,y:1}); JG=G.jacobian([u,v]).subs({u:Fp[0],v:Fp[1]})
print('5.3',Fp.T,JG,JF,JG*JF, G.subs({u:F[0],v:F[1]}).jacobian([x,y]).subs({x:1,y:1}))
# P5.5 inverse F=(x+y^2,y+x^2)
F=Matrix([x+y**2,y+x**2]); J=F.jacobian([x,y]); print('5.5',J.det(), J.subs({x:1,y:1}).inv())
# polar inverse at (2,pi/2)
T=Matrix([r*cos(th),r*sin(th)]); JT=T.jacobian([r,th]).subs({r:2,th:pi/2}); print('polar',JT, JT.inv())
# folium
f=x**3+y**3-6*x*y; print('fol', -diff(f,x)/diff(f,y)).subs({x:3,y:3}) if False else None
print('fol', (-diff(f,x)/diff(f,y)).subs({x:3,y:3}))
sol=solve([f, diff(f,y)],[x,y],dict=True); print('fol sing',sol)
# IFT slide example
f=x**2*y+3*y**3*x**4-4; print('ift', f.subs({x:1,y:1}), (-diff(f,x)/diff(f,y)).subs({x:1,y:1}))
# sensitivity cubic
print('cubic root mu=2.1', nsolve(x**3+x-2.1,x,1))
# eigen A(t)=[[t,1],[1,0]]
A=Matrix([[t,1],[1,0]]); ev=A.eigenvals(); print([diff(e,t).subs(t,0) for e in ev])
# Jacobian example F=(x^2y, x+y^3, sin xy) at (1,0)
F=Matrix([x**2*y,x+y**3,sin(x*y)]); print(F.jacobian([x,y]).subs({x:1,y:0}))
# exponential map
F=Matrix([exp(x)*cos(y),exp(x)*sin(y)]); print(simplify(F.jacobian([x,y]).det()), F.jacobian([x,y]).subs({x:0,y:pi/2}).inv())
# lagrange slide x+2y on circle
print('lag', sqrt(5))
# cylinder
print('cyl', (2*pi*5*10*0.1+pi*25*0.1), float(2*pi*5*10*0.1+pi*25*0.1), float(250*pi))
# differential dz for z=x^2 y polar
