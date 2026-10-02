clc
clear

L1 = 412;
L2 = 100;
L3 = 420;
L4 = 400;
L5 = 80;

%%% Datos_proporcionados_por_el_simulador %%%%%
px = input('Ingrese el valor de px: ')
py = input('Ingrese el valor de py: ')
pz = input('Ingrese el valor de pz: ')

ang_z = input('Ingrese el valor de ang_z: ')
ang_y = input('Ingrese el valor de ang_y: ')
ang_x = input('Ingrese el valor de ang_x: ')

R = rotz(ang_z)*roty(ang_y)*rotx(ang_x);

%%% Posición_de_la_muñeca %%%%%%%
ax = R(1,3);
ay = R(2,3);
az = R(3,3);

pmx = px - L5*ax;
pmy = py - L5*ay;
pmz = pz - L5*az;

rm = sqrt(pmx^2 + pmy^2);
d = sqrt((pmz - L1)^2 + (rm - L2)^2);

%%%% Theta_1 %%%%%%%%%%%%
theta1 = atan2d(-pmx,pmy)
theta11 = deg2rad(theta1);

%%%% Theta_2 %%%%%%%%%%%%%
alpha = atan2d(pmz - L1, rm - L2);
cbeta = (L3^2 + d^2 - L4^2)/(2*L3*d);
sbeta = sqrt(1 - cbeta^2);

beta = atan2d(sbeta,cbeta);
theta2 = beta - 90 + alpha
theta22 = deg2rad(theta2);

%%% Theta_3 %%%%%%%%%%%%%%%
cgamma = (L4^2 + L3^2 - d^2)/(2*L4*L3);
sgamma = sqrt(1 - cgamma^2);
gamma = atan2d(sgamma,cgamma);
theta3 = gamma - 90
theta33 = deg2rad(theta3);

%%% Orientación %%%%%%
syms theta44 theta55 theta66

T01 = DHL(theta11 + pi/2,L1,L2,90);        
T12 = DHL(theta22 + pi/2,0,L3,0);
T23 = DHL(theta33,0,0,-90);
T34 = DHL(theta44,-L4,0,90);
T45 = DHL(theta55,0,0,-90);
T56 = DHL(theta66,-L5,0,180);


%%% Matriz Literal %%%%%%%%%%%%%
M366 = simplify(T34*T45*T56);
M366_r = M366(1:3,1:3)

%%% Matriz Numérica %%%%%
M033 = T01*T12*T23;
R03 = M033(1:3,1:3);
R30 = R03.'; %%% Inversa de R03

R336 = R30*R
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
theta4 = atan2(R336(2,3),R336(1,3));
theta4 = rad2deg(theta4)

theta5 = atan2(sqrt(1-(R336(3,3)^2)),-R336(3,3));
theta5 = rad2deg(theta5)

theta6 = atan2(R336(3,2),R336(3,1));
theta6 = rad2deg(theta6)


function M=DHL(theta,d,a,alpha)

Mrot_z = [cos(theta) -sin(theta) 0 0
          sin(theta)  cos(theta) 0 0
          0           0          1 0
          0           0          0 1];

transl = [1 0 0 a
          0 1 0 0
          0 0 1 d
          0 0 0 1];
Mrot_x = [rotx(alpha) [0;0;0]
          0 0 0        1];

M=Mrot_z*transl*Mrot_x;
end

