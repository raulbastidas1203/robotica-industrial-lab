% Simulacion interactiva SCARA T3-401S basada en el DH de la semana 2.
% Ejecutar con Run. No requiere Robotics ni Symbolic Math Toolbox.
% Los originales del profesor se conservan en semana2..semana5.
fig=figure('Name','SCARA T3-401S | Robotica Industrial', ...
    'NumberTitle','off','Color',[0.96 0.98 1],'Position',[100 100 1100 650]);
ax=axes(fig,'Position',[0.07 0.15 0.57 0.75]);
q0=[30 55 -70 20]; mins=[-180 -150 -150 -180]; maxs=[180 150 0 180];
names={'theta1 [deg]','theta2 [deg]','d3 [mm]','theta4 [deg]'};
sliders=gobjects(4,1); labels=gobjects(4,1);
for k=1:4
    y=0.79-(k-1)*0.13;
    labels(k)=uicontrol(fig,'Style','text','Units','normalized', ...
        'Position',[0.70 y 0.26 0.04],'HorizontalAlignment','left', ...
        'BackgroundColor',[0.96 0.98 1],'FontSize',11,'String',names{k});
    sliders(k)=uicontrol(fig,'Style','slider','Units','normalized', ...
        'Position',[0.70 y-0.05 0.26 0.04],'Min',mins(k),'Max',maxs(k),'Value',q0(k));
end
readout=uicontrol(fig,'Style','text','Units','normalized','Position',[0.68 0.06 0.30 0.15], ...
    'HorizontalAlignment','left','BackgroundColor',[0.96 0.98 1],'FontSize',11);
btn=uicontrol(fig,'Style','pushbutton','Units','normalized','Position',[0.70 0.24 0.26 0.06], ...
    'String','Animar / Pausar','FontSize',11);
setappdata(fig,'axes',ax);setappdata(fig,'sliders',sliders);setappdata(fig,'labels',labels);
setappdata(fig,'readout',readout);setappdata(fig,'playing',false);
for k=1:4
    set(sliders(k),'Callback',@(~,~) manualUpdate(fig));
end
set(btn,'Callback',@(~,~) animateScara(fig));
drawScara(fig);

function manualUpdate(fig)
setappdata(fig,'playing',false);drawScara(fig);
end

function drawScara(fig)
sliders=getappdata(fig,'sliders');q=arrayfun(@(s)get(s,'Value'),sliders);
t=deg2rad(q([1 2 4]));
rows=[t(1) 0 225 0;t(2) 0 175 0;0 q(3) 0 0;t(3) 0 0 0];
T=eye(4);P=zeros(3,5);
for k=1:4
    a=rows(k,:);c=cos(a(1));s=sin(a(1));ca=cosd(a(4));sa=sind(a(4));
    A=[c -s*ca s*sa a(3)*c;s c*ca -c*sa a(3)*s;0 sa ca a(2);0 0 0 1];
    T=T*A;P(:,k+1)=T(1:3,4);
end
ax=getappdata(fig,'axes');cla(ax);hold(ax,'on');
plot3(ax,P(1,:),P(2,:),P(3,:),'-o','LineWidth',7,'MarkerSize',10, ...
    'Color',[0.09 0.55 0.55],'MarkerFaceColor',[0.94 0.64 0.3]);
quiver3(ax,P(1,end),P(2,end),P(3,end),50*T(1,1),50*T(2,1),50*T(3,1),0, ...
    'Color',[0.95 0.5 0.2],'LineWidth',2);
grid(ax,'on');axis(ax,'equal');xlim(ax,[-450 450]);ylim(ax,[-450 450]);zlim(ax,[-170 100]);
xlabel(ax,'X [mm]');ylabel(ax,'Y [mm]');zlabel(ax,'Z [mm]');view(ax,45,28);
title(ax,'SCARA T3-401S: cinematica directa');
labels=getappdata(fig,'labels');names={'theta1','theta2','d3','theta4'};
for k=1:4,set(labels(k),'String',sprintf('%s = %.1f',names{k},q(k)));end
set(getappdata(fig,'readout'),'String',sprintf('X = %.2f mm\nY = %.2f mm\nZ = %.2f mm\nGiro Z = %.2f deg',P(:,end),q(1)+q(2)+q(4)));
drawnow;
end

function animateScara(fig)
if getappdata(fig,'playing'),setappdata(fig,'playing',false);return;end
setappdata(fig,'playing',true);clock=tic;
while isgraphics(fig) && getappdata(fig,'playing')
    a=toc(clock)*0.55;x=235+65*cos(a);y=70+65*sin(a);
    c2=(x*x+y*y-225^2-175^2)/(2*225*175);
    t2=atan2(sqrt(max(0,1-c2*c2)),c2);
    t1=atan2(y,x)-atan2(175*sin(t2),225+175*cos(t2));
    q=[rad2deg(t1) rad2deg(t2) -70+15*sin(2*a) -rad2deg(t1+t2)];
    sliders=getappdata(fig,'sliders');for k=1:4,set(sliders(k),'Value',q(k));end
    drawScara(fig);pause(0.03);
end
end
