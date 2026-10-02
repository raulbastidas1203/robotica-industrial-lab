function M = DHL(theta,d,a,alpha)
% DHL Convencion del curso: theta en radianes, alpha en grados.
% Equivalente numerico a Rz(theta)*Tx(a)*Tz(d)*Rx(alpha).
c=cos(theta); s=sin(theta); ca=cosd(alpha); sa=sind(alpha);
M=[c -s*ca s*sa a*c; s c*ca -c*sa a*s; 0 sa ca d; 0 0 0 1];
end
