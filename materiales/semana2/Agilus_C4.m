clc
clear

%%% Longitudes_Eslabones %%%

L1 = 330;
L2 = 290;
L3 = 20;
L4 = 310;
L5 = 75;


%%% Valores_Articulares %%%

theta1 = input('Ingrese valor de theta1: ')
theta2 = input('Ingrese valor de theta2: ')
theta3 = input('Ingrese valor de theta3: ')
theta4 = input('Ingrese valor de theta4: ')
theta5 = input('Ingrese valor de theta5: ')
theta6 = input('Ingrese valor de theta6: ')

theta1 = deg2rad(theta1);
theta2 = deg2rad(theta2);
theta3 = deg2rad(theta3);
theta4 = deg2rad(theta4);
theta5 = deg2rad(theta5);
theta6 = deg2rad(theta6);

%%% Algoritmo_DH %%%

M01 = DHL(-theta1,L1,0,-90);
M12 = DHL(theta2,0,L2,0);
M23 = DHL(theta3 - pi/2,0,L3,90);
M34 = DHL(theta4,-L4,0,-90);
M45 = DHL(theta5,0,0,90);
M56 = DHL(theta6+pi,-L5,0,180);

M06 = M01*M12*M23*M34*M45*M56
rad2deg(tform2eul(M06))

% %%% Posición %%%
% 
% P = [M06(1,4)
%      M06(2,4)
%      M06(3,4)]
% 
% %%% Orientación %%%
% 
% Orie = rad2deg(tform2eul(M06))
% %%% MTH_Root(Robot)_Base %%%
% Mrb = [1 0 0  13.64
%        0 1 0 -450.66
%        0 0 1  359.14
%        0 0 0    1  ];
% 
% Mb_br = (inv(Mrb))*M06
% 
% angulosb_br = rad2deg(tform2eul(Mb_br))
% %%%% Cinemática_Inversa %%%%%%%%%%%%
% 
% theta11 = atan2d(-P(2,1),P(1,1))

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