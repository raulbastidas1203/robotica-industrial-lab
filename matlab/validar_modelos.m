function validar_modelos
% VALIDAR_MODELOS Compara 21 poses del curso y sus jacobianos.
% Abrir este archivo y pulsar Run en MATLAB. Solo requiere MATLAB base.
% Las referencias se generaron desde los .mlx originales con Python;
% las pruebas de la web comparan sus resultados con estas mismas referencias.
folder = fileparts(mfilename('fullpath'));
cases = jsondecode(fileread(fullfile(folder,'..','tests','fixtures','course-reference.json')));
maxPoseError = 0; maxJacobianError = 0;
for k = 1:numel(cases)
    sample = cases(k); q = sample.q(:).';
    [T,J,prism] = model(sample.robot,q);
    poseError = max(abs(T(:)-sample.end(:)));
    assert(poseError < 1e-9,'Pose inconsistente: %s, caso %d',sample.robot,k);
    maxPoseError = max(maxPoseError,poseError);
    h = 1e-6;
    for j = 1:numel(q)
        step = rad2deg(h);
        if j == prism, step = h; end
        qp = q; qm = q; qp(j) = qp(j)+step; qm(j) = qm(j)-step;
        Tp = model(sample.robot,qp); Tm = model(sample.robot,qm);
        dT = (Tp-Tm)/(2*h);
        W = dT(1:3,1:3)*T(1:3,1:3).';
        numerical = [dT(1:3,4); W(3,2); W(1,3); W(2,1)];
        jacError = max(abs(J(:,j)-numerical));
        assert(jacError < 1e-4,'Jacobiano inconsistente: %s, caso %d, columna %d',sample.robot,k,j);
        maxJacobianError = max(maxJacobianError,jacError);
    end
end
fprintf('OK: %d poses y sus jacobianos, incluidas configuraciones singulares.\n',numel(cases));
fprintf('Error maximo de pose: %.3g; de jacobiano: %.3g.\n',maxPoseError,maxJacobianError);
fprintf('Convencion SCARA: z=d3. Agilus: primera columna asociada a -theta1.\n');
fprintf('Esta comprobacion no prueba los callbacks graficos de simular_scara.m.\n');
end

function [T,J,prism] = model(name,q)
t = deg2rad(q); prism = 0; signs = ones(1,numel(q));
switch name
    case 'scara'
        prism = 3;
        rows = [t(1) 0 225 0;t(2) 0 175 0;0 q(3) 0 0;t(4) 0 0 0];
    case 'vt6'
        rows = [t(1)+pi/2 412 100 90;t(2)+pi/2 0 420 0;t(3) 0 0 -90; ...
            t(4) -400 0 90;t(5) 0 0 -90;t(6) -80 0 180];
    case 'agilus'
        signs(1) = -1;
        rows = [-t(1) 330 0 -90;t(2) 0 290 0;t(3)-pi/2 0 20 90; ...
            t(4) -310 0 -90;t(5) 0 0 90;t(6)+pi -75 0 180];
    otherwise
        error('Modelo desconocido: %s',name);
end
T = eye(4); frames = zeros(4,4,numel(q)+1); frames(:,:,1) = T;
for i = 1:numel(q)
    T = T*DHL(rows(i,1),rows(i,2),rows(i,3),rows(i,4));
    frames(:,:,i+1) = T;
end
J = zeros(6,numel(q));
for i = 1:numel(q)
    axis = signs(i)*frames(1:3,3,i);
    if i == prism
        J(:,i) = [axis;0;0;0];
    else
        J(:,i) = [cross(axis,T(1:3,4)-frames(1:3,4,i));axis];
    end
end
end
