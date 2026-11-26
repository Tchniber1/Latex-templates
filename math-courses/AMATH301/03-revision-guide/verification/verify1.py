from sympy import *
x,y,z,t,h,k=symbols('x y z t h k',real=True)
def chk(name,a,b): print(name, simplify(a-b)==0)
# TD2 ex1(2)
f=x**2*y+sin(x*y); X=(t**2+1,exp(t))
lhs=diff(f.subs({x:X[0],y:X[1]}),t)
rhs=exp(t)*((t**2+1)**2+4*t*(t**2+1)+(t+1)**2*cos((t**2+1)*exp(t)))
chk('td2-1-2',lhs,rhs)
# TD3 ex1 table
rows=[(exp(2*x*y),4*y**2*exp(2*x*y),4*x**2*exp(2*x*y),(2+4*x*y)*exp(2*x*y)),
(exp(x**2+2*y**2),(2+4*x**2)*exp(x**2+2*y**2),(4+16*y**2)*exp(x**2+2*y**2),8*x*y*exp(x**2+2*y**2)),
(x**3*y**2-4*x*y**3,6*x*y**2,2*x**3-24*x*y,6*x**2*y-12*y**2),
(x**2*exp(y)+y**2*exp(x),2*exp(y)+y**2*exp(x),x**2*exp(y)+2*exp(x),2*x*exp(y)+2*y*exp(x))]
u=x**2+x*y+y**2; rows.append((cos(u),-2*sin(u)-(2*x+y)**2*cos(u),-2*sin(u)-(x+2*y)**2*cos(u),-sin(u)-(2*x+y)*(x+2*y)*cos(u)))
D=1+x**2+y**2; rows.append((log(D),2*(1-x**2+y**2)/D**2,2*(1+x**2-y**2)/D**2,-4*x*y/D**2))
E=1+x**2*y**2; rows.append((atan(x*y),-2*x*y**3/E**2,-2*x**3*y/E**2,(1-x**2*y**2)/E**2))
rows.append((x/(1+y**2),0,2*x*(3*y**2-1)/(1+y**2)**3,-2*y/(1+y**2)**2))
S=sqrt(1+x**2+y**2); rows.append((S,(1+y**2)/S**3,(1+x**2)/S**3,-x*y/S**3))
rows.append((exp(x+y)*sin(x-y),2*exp(x+y)*cos(x-y),-2*exp(x+y)*cos(x-y),2*exp(x+y)*sin(x-y)))
for i,(f,a,b,c) in enumerate(rows):
    print('td3-1',i,simplify(diff(f,x,2)-a)==0,simplify(diff(f,y,2)-b)==0,simplify(diff(f,x,y)-c)==0)
# TD3 ex2
r=sqrt(x**2+y**2+z**2)
for f,res in [(x**2*y**3*z**4,24*x*y**2*z**3),(exp(x*y*z),(1+3*x*y*z+x**2*y**2*z**2)*exp(x*y*z)),
 (sin(x*y*z),(1-x**2*y**2*z**2)*cos(x*y*z)-3*x*y*z*sin(x*y*z)),(cos(x+2*y-3*z),-6*sin(x+2*y-3*z)),
 (log(1+x**2+y**2+z**2),16*x*y*z/(1+x**2+y**2+z**2)**3)]:
    print('td3-2',simplify(diff(f,x,y,z)-res)==0)
print('td3-2 r', simplify(diff(1/r,x,y)-3*x*y/r**5)==0)
# TD3 ex8/9 series
def T(f,n):
    s=series(f.subs({x:t*x,y:t*y}),t,0,n+1).removeO().subs(t,1); return expand(s)
print(T(exp(x+2*y),2)); print(T(1/(1+x+2*y),2)); print(T(sqrt(1+x**2+2*y**2),2)); print(T(log(1+x+2*y),3)); print(T(cos(x)*cos(y),4))
print(expand(T(exp(x)*cos(y),6)-T(exp(x)*cos(y),5)))
# TD3 ex10
def T2(f,a,b):
    H=symbols('H'); fs=f.subs({x:a+h,y:b+k}); s=series(fs.subs({h:t*h,k:t*k}),t,0,3).removeO().subs(t,1); return simplify(expand(s))
for f,a,b in [(sin(x*y),1,pi),(cos(x+y),pi/2,0),(log(x+y),1,1),(x**2*y+y**2,1,-1),(exp(x)*sin(y),0,pi/2)]:
    print('T2',f,expand(T2(f,a,b)))
# TD3 ex6
print(diff(x**6*y**5,x,4,y,3), diff(5*x**6*y**2-3*x**7*y,x,6,y,2))
f=3*x**2*y*z**3-4*x**3*y**2*z+6*x**5*y**4*z**2
print(diff(f,x,2,y,1,z,3).subs({x:0,y:0,z:0}),diff(f,x,3,y,2,z,1).subs({x:0,y:0,z:0}),diff(f,x,5,y,4,z,2).subs({x:0,y:0,z:0}))
