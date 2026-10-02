clc
clear
syms theta1 theta2 theta3 theta4 theta5 theta6
syms L1 L2 L3 L4 L5

%%% Algoritmo_DH %%%

M01 = DHL(-theta1,L1,0,-90);
M12 = DHL(theta2,0,L2,0);
M23 = DHL(theta3 - pi/2,0,L3,90);
M34 = DHL(theta4,-L4,0,-90);
M45 = DHL(theta5,0,0,90);
M56 = DHL(theta6+pi,-L5,0,180);

M06 = simplify(M01*M12*M23*M34*M45*M56);

%%% Jacobiano_Lineal %%%
theta = [theta1 theta2 theta3 theta4 theta5 theta6];
Pos = M06(1:3,4);
JL = simplify(jacobian(Pos,theta))
%%% Jacobiano_Angular %%%
z0 = [0
      0
      1];

R01 = M01(1:3,1:3);
z1 = R01(1:3,3);

M02 = M01*M12;
R02 = M02(1:3,1:3);
z2 = R02(1:3,3);

M03 = M01*M12*M23;
R03 = M03(1:3,1:3);
z3 = R03(1:3,3);

M04 = M03*M34;
R04 = M04(1:3,1:3);
z4 = R04(1:3,3);

M05 = M04*M45;
R05 = M05(1:3,1:3);
z5 = R05(1:3,3);

Jw = [z0 z1 z2 z3 z4 z5];

J = [JL
     Jw]
theta1 = pi/8;
theta2 = pi/3;
theta3 = pi/7;
theta4 = pi/10;
theta5 = pi/9;
theta6 = pi/6;

qp = [pi/12
      pi/3
      pi/5
      pi/8
      pi/6
      pi/15];

L1 = 330;
L2 = 290;
L3 = 20;
L4 = 310;
L5 = 75;

JJ = eval(J)
veloc = JJ*qp

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