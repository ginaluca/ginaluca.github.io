/*global THREE TWEEN */
var Rubik=function(Np,sidep,dspp, cubeletFactory)
{
    THREE.Object3D.call(this);
    this.RA=Math.PI*0.5;
    this.AXES = ['x', 'y', 'z'];
    
	this.rubik=null;
	this.rotation_in_progress=false;
	this.scramble_in_progress=false;
	this.undolist=[];
	this.undo_in_action=false;
	this.undolist_length=200;
	//this.ren=render;
	this.onChange=null;
	
	this.sides={bottom:3,top:2,	right:0,left:1,	front:4,back:5};
	var side=200;
	if (typeof sidep !='undefined' && sidep>0)
	side=sidep;
	var N=3;
	if (typeof Np !='undefined' && Np>0)
	N=parseInt(Np);
	var dsp=0.3;
	if (typeof dspp !='undefined' && dspp>0)
	dsp=dspp;
	
	//N=3;
	var cubelets = [];
	var xx,yy,zz;
	var Nz=N,Nx=N,Ny=N;
	var sidex=side, sidey=side, sidez=side;
	var cubletsidex=sidex/(Nx+(Nx-1)*dsp);
	var cubletsidey=sidey/(Ny+(Ny-1)*dsp);
	var cubletsidez=sidez/(Nz+(Nz-1)*dsp);
	
	// build cubelets
	for (zz=0;zz<Nz;zz++)
	{
		for (xx=0;xx<Nx;xx++)
		{
			for (yy=0;yy<Ny;yy++)
			{						
                var cubelet = cubeletFactory(
                    new THREE.Vector3(xx, yy, zz), 
                    { cubeletCount: {x: Nx, y: Ny, z: Nz}, cubeSize: side});
                cubelet.position.x = (cubletsidex+dsp*cubletsidex)*xx -sidex/2 +cubletsidex/2;
                cubelet.position.y = (cubletsidey+dsp*cubletsidey)*yy -sidey/2 +cubletsidey/2;
                cubelet.position.z = (cubletsidez+dsp*cubletsidez)*zz -sidez/2 +cubletsidez/2;
                
                this.add(cubelet);
                cubelets.push(cubelet);
			}
		}
	}
	this.rubik={N:N, cubelets:cubelets, side:sidex, cubeletside:cubletsidex, dsp:dsp};
	//this.ren.renderer.render(this.ren.scene,this.ren.camera);
};
// Rubik is subclass of Object3D
Rubik.prototype=new THREE.Object3D();
Rubik.prototype.constructor = Rubik;
Rubik.prototype.addHistory=function(actionobj)
{
	if (!this.undo_in_action)
	{
		while (this.undolist.length>=this.undolist_length) {var foo=this.undolist.shift();}
		this.undolist.push(actionobj);
	}
};
Rubik.prototype.getCubeletSeenCoords=function(cubelet)
{
    if (this.rubik==null || this.rotation_in_progress) return(null);
	var c;
	if (cubelet instanceof THREE.Mesh)
		c=cubelet;
	else
		c=this.rubik.cubelets[cubelet];
	c.matrixAutoUpdate = false;
	c.updateMatrixWorld(true);
	c.position.getPositionFromMatrix(c.matrix);
	var cubeletseenas={xx:Math.round((c.position.x+this.rubik.side/2-this.rubik.cubeletside/2)/(this.rubik.cubeletside*(1+this.rubik.dsp))),
						yy:Math.round((c.position.y+this.rubik.side/2-this.rubik.cubeletside/2)/(this.rubik.cubeletside*(1+this.rubik.dsp))),
						zz:Math.round((c.position.z+this.rubik.side/2-this.rubik.cubeletside/2)/(this.rubik.cubeletside*(1+this.rubik.dsp)))};
	return(cubeletseenas);
};
Rubik.prototype.getCubeletsIndex=function(axis,row){
	if (this.rubik==null) return([]);
	if (this.rotation_in_progress) return([]);
	
	var a=[], result=[];
	
	if (row<0 || row>=this.rubik.N) return([]);
	
	axis=axis.charAt(0);
	axis=axis.toLowerCase();
	
	for (var i=0;i<this.rubik.cubelets.length;i++)
	{
		this.rubik.cubelets[i].matrixAutoUpdate = false;
		this.rubik.cubelets[i].updateMatrixWorld(true);
		this.rubik.cubelets[i].position.getPositionFromMatrix(this.rubik.cubelets[i].matrix);
		switch(axis)
		{
		case "y":
				a[i]=[i,this.rubik.cubelets[i].position.y];
				break;
		case "x":
				a[i]=[i,this.rubik.cubelets[i].position.x];
				break;
		case "z":
				a[i]=[i,this.rubik.cubelets[i].position.z];
				break;
		default:return(null); break;
		}
	}
	var cmp=function(aa,bb){return (aa[1]-bb[1]);};
	a.sort(cmp);
	for (i=0;i<this.rubik.N*this.rubik.N;i++)
		result[i]=a[row*this.rubik.N*this.rubik.N+i][0];
	return(result);
};
Rubik.prototype.decorateFacesAsSeen=function(cubelet)
{
    if (this.rubik==null || this.rotation_in_progress) return(null);
	
	var eq=function(a,b)
	{
		var delta=0;
		var aa=new THREE.Vector3(Math.round(a.x),Math.round(a.y),Math.round(a.z));
		var bb=new THREE.Vector3(Math.round(b.x),Math.round(b.y),Math.round(b.z));
		
		if (Math.abs(aa.x-bb.x)<=delta && Math.abs(aa.y-bb.y)<=delta && Math.abs(aa.z-bb.z)<=delta)
			return(true);
		return(false);
	};
	var c;
	if (cubelet instanceof THREE.Mesh)
		c=cubelet;
	else
		c=this.rubik.cubelets[cubelet];
	var n=[];
	c.matrixAutoUpdate = false;
	c.updateMatrixWorld(true);
	c.position.getPositionFromMatrix(c.matrix);
	c.geometry.computeFaceNormals();
	var m=c.matrix.clone();
	m.setPosition(new THREE.Vector3(0,0,0));
	for (var i=0;i<c.geometry.faces.length;i++)
	{
    	 n.push(c.geometry.faces[i].normal.clone().applyMatrix4(m).normalize());
	}
	var materials=c.geometry.materials;
	var mat=null;
	var matname="";
	var r1=[],r2=[],r3=[],r4=[];
    var direction;
	for (var i=0;i<n.length;i++)
	{
			if (eq(n[i],new THREE.Vector3(0,1,0))) // face seen as top
			{
                c.geometry.faces[i].asseen = "top";
			}
			if (eq(n[i],new THREE.Vector3(0,-1,0))) // face seen as bottom
			{
                c.geometry.faces[i].asseen = "bottom";
                direction = "bottom";
			}
			if (eq(n[i],new THREE.Vector3(0,0,1))) // face seen as front
			{
                c.geometry.faces[i].asseen = "front";
                direction = "front";
			}
			if (eq(n[i],new THREE.Vector3(0,0,-1))) // face seen as back
			{
                c.geometry.faces[i].asseen = "back";
                direction = "back";
			}
		// take left-right opposite due to papervision 3d left-right definition on cube etc..?? NO NO
			if (eq(n[i],new THREE.Vector3(-1,0,0))) // face seen as left
			{
                c.geometry.faces[i].asseen = "left";
                direction = "left";
			}
			if (eq(n[i],new THREE.Vector3(1,0,0))) // face seen as right
			{
                c.geometry.faces[i].asseen = "right";
                direction = "right";
			}
	}
};
Rubik.prototype.rotate=function(params, callback) 
{
	if (this.rubik==null) return;
	if (this.rotation_in_progress) return;

	var duration=5;
	var axis=params.axis;
	var row=params.row;
	if (params.duration!=null) duration=params.duration;
	var angle=params.angle;

	if (duration <=0) return;
	if (angle==0) return;
	var ind=this.getCubeletsIndex(axis,row);
	if (ind==null) return; 			
	axis=axis.charAt(0);
	axis=axis.toLowerCase();

	var tthis=this;
	var obj;
	var count=this.rubik.N*this.rubik.N;
	var onemore=0;

	var onComplete=function(g)
	{
		onemore++;
		if (onemore>=count)
		{
			this.thiss.rotation_in_progress=false;
			onemore=0;
			//this.thiss.ren.renderer.render(this.thiss.ren.scene,this.thiss.ren.camera);
			if (this.params.onComplete!=null)
				this.params.onComplete.call(this.thiss);
			if (this.thiss.onChange!=null)
				this.thiss.onChange.call(this.thiss);
            if (callback) {
                callback(params);
            }
		}
	};

	var onChange=function()
	{
		var m=new THREE.Matrix4();
		switch(this.axis)
		{
			case "x":
					m.makeRotationX(this.angle-this.prevangle);
					break;
			case "y":
					m.makeRotationY(this.angle-this.prevangle);
					break;
					
			case "z":
					m.makeRotationZ(this.angle-this.prevangle);
					break;
			default: return; break;
		}
		this.cubelet.matrixAutoUpdate = false;
		this.cubelet.matrix.multiplyMatrices(m,this.cubelet.matrix);
		this.cubelet.position.getPositionFromMatrix(this.cubelet.matrix);
		this.cubelet.matrixWorldNeedsUpdate = true;
		this.prevangle=this.angle;
	};
				
	this.rotation_in_progress=true;
	for (var k=0;k<ind.length;k++)
	{
		obj={
            cubelet:this.rubik.cubelets[ind[k]], 
            axis:axis, 
            angle:0, 
            prevangle:0, 
            thiss:this, params:params
            };
            
		new TWEEN.Tween( obj )
            .onUpdate(onChange)
            .onComplete(onComplete)
            .to( {angle: angle*this.RA}, duration * Math.abs(angle) * 1000 )
            .easing( TWEEN.Easing.Cubic.InOut)
            .start();
	}
	params.angle=-angle;
	//params.onComplete=null;
	this.addHistory({func:this.rotate, param:params, actiontype:"rotate"});
};
Rubik.prototype.scramble=function(rotationNum) {
    this.scramble_in_progress = true;
    var rotations = [];
    var thiss=this;
    for (var i = 0; i < rotationNum; i++) {
        var axisIdx = Math.floor(Math.random() * 3);
        var row = Math.floor(Math.random() * 3);
        var angle = Math.floor(Math.random() * 2);
        angle = angle? angle: -1; 
        rotations.push({ axis: this.AXES[axisIdx], row: row, angle: angle, duration: 0.2});
    }
    var recurRotate = function(i) {
        if (i == rotations.length) {
            this.scramble_in_progress = false;
        } else {
            thiss.rotate(rotations[i], function(params) {
                recurRotate(i + 1);
            });        
        }
    }
    recurRotate(0);
}
