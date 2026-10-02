clc
clear

L1 = 412;
L2 = 100;
L3 = 420;
L4 = 400;
L5 = 80;

theta1 = input('Ingrese valor de theta1: ');
theta2 = input('Ingrese valor de theta2: ');
theta3 = input('Ingrese valor de theta3: ');
theta4 = input('Ingrese valor de theta4: ');
theta5 = input('Ingrese valor de theta5: ');
theta6 = input('Ingrese valor de theta6: ');

theta1 = deg2rad(theta1);
theta2 = deg2rad(theta2);
theta3 = deg2rad(theta3);
theta4 = deg2rad(theta4);
theta5 = deg2rad(theta5);
theta6 = deg2rad(theta6);

M01 = DHL(theta1 + pi/2,L1,L2,90);
M12 = DHL(theta2 + pi/2,0,L3,0);
M23 = DHL(theta3,0,0,-90);
M34 = DHL(theta4,-L4,0,90);
M45 = DHL(theta5,0,0,-90);
M56 = DHL(theta6,-L5,0,180);

M06 = M01*M12*M23*M34*M45*M56
euler = rad2deg(tform2eul(M06))


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


