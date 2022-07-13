import { Component, ElementRef, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { MainService } from '../services/main.service';
import { EChartsOption } from 'echarts';
import { NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { config } from 'rxjs';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  @ViewChild('canvas', { static: true }) canvas: ElementRef<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D;
  pathImage = "";
  opacity:number = 0;
  arrayStory: any = [];
  dataImageOrigin: any;
  storyIndice: number = 0;
  histogramme: any = {
    redHisto : [],
    greenHisto: [],
    blueHisto: []
  };

  mergeOptions = {};

  chartOption: EChartsOption = {
    xAxis: {
      type: 'category',
      //data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    yAxis: {
      type : 'value',

      show : false,

      splitLine: {

        show: false

      }
    },
    series: [
      {
        data: this.histogramme.redHisto,
        type: 'line',
        smooth: true,
        showSymbol: false,
        color: '#FF9F9F'

      },
      {
        data: this.histogramme.greenHisto,
        type: 'line',
        smooth: true,
        showSymbol: false,
        color: '#9FCF9F'
      },
      {
        data: this.histogramme.blueHisto,
        type: 'line',
        smooth: true,
        showSymbol: false,
        color: '#9F9FFF'
      }
    ],
  };

  constructor(private mainService: MainService,config: NgbModalConfig, private modalService: NgbModal) {
    config.backdrop = 'static';
    config.keyboard = false;
  }

  ngOnInit() {
  }

  change(eventTarget: any) {
    let imgPath = URL.createObjectURL(eventTarget);
    this.pathImage = "initialized";
    this.draw(this.canvas, imgPath);
  }

  draw(canvas: ElementRef<HTMLCanvasElement>, path: string) {
    let img = new Image();
    let self: any = this;
    img.onload = function(){
      let imgHeight = window.innerHeight - 100;
      let imgWidth = ((window.innerHeight - 100) * img.width) / img.height;
      self.ctx = canvas.nativeElement.getContext('2d');
      canvas.nativeElement.height = imgHeight;
      canvas.nativeElement.width = imgWidth > 920 ? 920 : imgWidth;
      self.ctx.drawImage(img, 0, 0, canvas.nativeElement.width, canvas.nativeElement.height);
      self.dataImageOrigin = self.ctx.getImageData(0, 0, canvas.nativeElement.width, canvas.nativeElement.height);
      self.resetImage(self.dataImageOrigin, -1);
      self.setStory("Ouvrir image", self.dataImageOrigin);
      self.getHistogramme();
    }
    img.src = path;
  }

  putOriginal(): void {
    this.ctx.putImageData(this.dataImageOrigin, 0,0);
    this.getHistogramme();
  }

  resetImage(imageData: any, index: any): void {
    this.ctx.putImageData(imageData, 0, 0);
    this.dataImageOrigin = imageData;
    this.getHistogramme()
    this.storyIndice =  index
  }

  drawMiniFiltre(canvasId: string): any{
    let miniCanvas: any = document.getElementById(canvasId);
    let ctxMiniCanvas: any = miniCanvas.getContext('2d');
    let imgMiniCanvas = new Image();
    let imgMainCanvasURL = this.canvas.nativeElement.toDataURL("image/png");


    imgMiniCanvas.onload = function() {
      let imgWidth: any = ((miniCanvas.height + 10)*imgMiniCanvas.width)/imgMiniCanvas.height;
      miniCanvas.width = imgWidth < 120 ? imgWidth : 120;

      ctxMiniCanvas.drawImage(imgMiniCanvas, 0, 0, miniCanvas.width, miniCanvas.height);
    }
    imgMiniCanvas.src = imgMainCanvasURL;

    return miniCanvas
  }

  onContour(): void {
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;

    let colorRed : number[]= [];
    let colorGreen : number[] = [];
    let colorBlue: number[] = [];

    for(let i=0; i < data.length; i+=4){
      colorRed.push(data[i]);
      colorGreen.push(data[i + 1]);
      colorBlue.push(data[i + 2]);
    }


    let redRes: any[] = this.paperTurtle(this.transformation2D(colorRed));
    let greenRes: any[] = this.paperTurtle(this.transformation2D(colorGreen));
    let blueRes: any[] = this.paperTurtle(this.transformation2D(colorBlue));
  }

  paperTurtle(matriceImage: any[][]): any {
    let turtleOrientation: string = "nord";
    //let matriceImage: any[][] = [[0, 0, 0, 0, 0, 0], [0, 0, 1, 1, 0, 0], [0, 1, 1, 1, 1, 1], [0, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0]];
    let coordContourDepart: any = {x: 0, y: 0};
    let currentCoord: any = {x: 0, y: 0};
    let infoCurrentPosition: any = {};
    let contour: any[] = [];
    let continueToWalk: boolean = true;

    loop1:
      for(let i = 0; i < matriceImage.length; i++) {
      loop2 :
        for(let j = 0; j < matriceImage[i].length; j++) {
          if(matriceImage[i][j] == 255) {
            coordContourDepart.x = j;
            coordContourDepart.y = i;
            infoCurrentPosition = this.turtleGoLeft(turtleOrientation, coordContourDepart.x, coordContourDepart.y);
            currentCoord.x = infoCurrentPosition.x;
            currentCoord.y = infoCurrentPosition.y;
            turtleOrientation = infoCurrentPosition.headOrientation;
            contour.push({x: coordContourDepart.x, y: coordContourDepart.y});
            break loop2
          }
        }
        if(matriceImage[i][coordContourDepart.x] == 255) {
          break loop1;
        }
    }

    do {
      if(matriceImage[currentCoord.y][currentCoord.x] == 255) {
        if(contour[contour.length - 1].x != currentCoord.x && contour[contour.length - 1].y != currentCoord.y) {
          contour.push({x: currentCoord.x, y: currentCoord.y});
        } else if(contour[contour.length - 1].x != currentCoord.x && contour[contour.length - 1].y == currentCoord.y) {
          contour.push({x: currentCoord.x, y: currentCoord.y});
        } else if(contour[contour.length - 1].x == currentCoord.x && contour[contour.length - 1].y != currentCoord.y) {
          contour.push({x: currentCoord.x, y: currentCoord.y});
        }

        infoCurrentPosition = this.turtleGoLeft(turtleOrientation, currentCoord.x, currentCoord.y);
        currentCoord.x = infoCurrentPosition.x;
        currentCoord.y = infoCurrentPosition.y;
        turtleOrientation = infoCurrentPosition.headOrientation;

        if(coordContourDepart.x == currentCoord.x) {
          if(coordContourDepart.y == currentCoord.y) {
            continueToWalk = false;
          }
        }

      } else if(matriceImage[currentCoord.y][currentCoord.x] == 0) {
        infoCurrentPosition = this.turtleGoRight(turtleOrientation, currentCoord.x, currentCoord.y);
        currentCoord.x = infoCurrentPosition.x;
        currentCoord.y = infoCurrentPosition.y;
        turtleOrientation = infoCurrentPosition.headOrientation;

        if(coordContourDepart.x == currentCoord.x) {
          if(coordContourDepart.y == currentCoord.y) {
            continueToWalk = false;
          }
        }
      } else {
        infoCurrentPosition = this.turtleGoRight(turtleOrientation, currentCoord.x, currentCoord.y);
        currentCoord.x = infoCurrentPosition.x;
        currentCoord.y = infoCurrentPosition.y;
        turtleOrientation = infoCurrentPosition.headOrientation;

        if(coordContourDepart.x == currentCoord.x) {
          if(coordContourDepart.y == currentCoord.y) {
            continueToWalk = false;
          }
        }
      }
    } while (continueToWalk)
    console.log("contour ", contour);
    return contour;
  }

  turtleGoLeft(headOrientation: string, pX: number, pY: number): any {
    let newPosition: any = {x: 0, y: 0, headOrientation: ""}
    if(headOrientation == "nord") {
      newPosition.x = pX;
      newPosition.y = pY - 1;
      newPosition.headOrientation = "ouest"
    }
    if(headOrientation == "ouest") {
      newPosition.x = pX - 1;
      newPosition.y = pY;
      newPosition.headOrientation = "sud"
    }
    if(headOrientation == "sud") {
      newPosition.x = pX;
      newPosition.y = pY + 1;
      newPosition.headOrientation = "est";
    }
    if(headOrientation == "est") {
      newPosition.x = pX + 1;
      newPosition.y = pY;
      newPosition.headOrientation = "nord";
    }

    return newPosition;
  }

  turtleGoRight(headOrientation: string, pX: number, pY: number): any {
    let newPosition: any = {x: 0, y: 0, headOrientation: ""}
    if(headOrientation == "nord") {
      newPosition.x = pX;
      newPosition.y = pY + 1;
      newPosition.headOrientation = "est"
    }
    if(headOrientation == "ouest") {
      newPosition.x = pX + 1;
      newPosition.y = pY;
      newPosition.headOrientation = "nord"
    }
    if(headOrientation == "sud") {
      newPosition.x = pX;
      newPosition.y = pY - 1;
      newPosition.headOrientation = "ouest";
    }
    if(headOrientation == "est") {
      newPosition.x = pX - 1;
      newPosition.y = pY;
      newPosition.headOrientation = "sud";
    }

    return newPosition;
  }

  setStory(nameTache: any, imageData: any): void {
    if(this.storyIndice < this.arrayStory.length - 1) {
      this.arrayStory.length = this.storyIndice+1;
    }
    this.arrayStory.push({nameTache: nameTache, imageData: imageData});
    this.dataImageOrigin = imageData;
    this.storyIndice++;
  }

  open(content: any) {
    let self: any = this;

    let modalRef: any = this.modalService.open(content, {windowClass: 'background-transparent', backdropClass: 'transparent-backdrop', size: 'lg'}).result.then((result) => {
      if(result == "save") {
        let input:any = document.getElementsByName("miniCanvas");
        for(let i=0; i < input.length; i++) {
            if(input[i].checked) {
              if(input[i].value != "original") {
                let imageData: any = self.ctx.getImageData(0, 0, self.canvas.nativeElement.width, self.canvas.nativeElement.height);
                self.setStory("Filtrage : "+input[i].value, imageData);
              }
            }
        }
      } else {
        self.putOriginal()
      }
        console.log("close result", result);
    }, (reason) => {

    });
    this.drawMiniFiltre('canvasDepart');
    let miniCanvasLiss: any = this.drawMiniFiltre('canvasLissage');
    let miniCanvasGauss: any = this.drawMiniFiltre('canvasGaussien');
    let miniCanvasConv: any = this.drawMiniFiltre('canvasConvolution');
    let miniCanvasReh: any = this.drawMiniFiltre('canvasRehausseur');
    let miniCanvasAcc: any = this.drawMiniFiltre('canvasAccentuation');
    let miniCanvasLap: any = this.drawMiniFiltre('canvasLaplacien');
    setTimeout(function(){
      self.onFiltrageLineaire("lissage", false, miniCanvasLiss, miniCanvasLiss.getContext('2d'));
      self.onFiltrageLineaire("gaussien", false, miniCanvasGauss, miniCanvasGauss.getContext('2d'));
      self.onFiltrageLineaire("convolution", false, miniCanvasConv, miniCanvasConv.getContext('2d'));
      self.onFiltrageLineaire("rehausseur", false, miniCanvasReh, miniCanvasReh.getContext('2d'));
      self.onFiltrageLineaire("accentuation", false, miniCanvasAcc, miniCanvasAcc.getContext('2d'));
      self.onFiltrageLineaire("laplacien", false, miniCanvasLap, miniCanvasLap.getContext('2d'));
    }, 0)
  }

  getHistogramme(): void {
    let colorRed: number[] = [];
    let colorGreen: number[] = [];
    let colorBlue: number[] = [];
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      colorRed.push(data[i]);
      colorGreen.push(data[i + 1]);
      colorBlue.push(data[i + 2]);
    }

    let colorRedRefactored: any = this.mainService.refactorColorData(colorRed);
    let colorGreenRefactored: any = this.mainService.refactorColorData(colorGreen);
    let colorBlueRefactored: any = this.mainService.refactorColorData(colorBlue);

    this.histogramme.redHisto = this.mainService.calculHisto(colorRedRefactored.histo);
    this.histogramme.greenHisto = this.mainService.calculHisto(colorGreenRefactored.histo);
    this.histogramme.blueHisto = this.mainService.calculHisto(colorBlueRefactored.histo);

    this.mergeOptions = {
      series: [
        {
          data: this.mainService.calculHisto(colorRedRefactored.histo),
          type: 'line',
          smooth: true,
          showSymbol: false,
          color: '#FF9F9F'

        },
        {
          data: this.mainService.calculHisto(colorGreenRefactored.histo),
          type: 'line',
          smooth: true,
          showSymbol: false,
          color: '#9FCF9F'
        },
        {
          data: this.mainService.calculHisto(colorBlueRefactored.histo),
          type: 'line',
          smooth: true,
          showSymbol: false,
          color: '#9F9FFF'
        }
      ]
    }
  }

  onBinarisation(isToStuckInStory: boolean): void {
    this.onGrayNiveau(false);
    let colorRed: number[] = [];
    let colorGreen: number[] = [];
    let colorBlue: number[] = [];
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;



    for (let i = 0; i < data.length; i += 4) {
      colorRed.push(data[i]);
      colorGreen.push(data[i + 1]);
      colorBlue.push(data[i + 2]);
    }

    let colorRedRefactored: any = this.mainService.refactorColorData(colorRed);
    let colorGreenRefactored: any = this.mainService.refactorColorData(colorGreen);
    let colorBlueRefactored: any = this.mainService.refactorColorData(colorBlue);

    let histoRed: number[] = this.mainService.calculHisto(colorRedRefactored.histo);
    let histoGreen: number[] = this.mainService.calculHisto(colorGreenRefactored.histo);
    let histoBlue: number[] = this.mainService.calculHisto(colorBlueRefactored.histo);

    let redRefactored: any[] = this.mainService.makeColorArray(colorRedRefactored.histo);
    let greenRefactored: any[] = this.mainService.makeColorArray(colorGreenRefactored.histo);
    let blueRefactored: any[] = this.mainService.makeColorArray(colorBlueRefactored.histo);

    let redRes: any = this.mainService.binarisation(redRefactored, histoRed);
    let iter: number = 0
    colorRed.forEach((item, index) => {
      data[iter] = redRes[redRefactored.indexOf(item)];
      colorRed[index] = redRes[redRefactored.indexOf(item)];
      iter += 4;
    });

    let greenRes: any = this.mainService.binarisation(greenRefactored, histoGreen);
    let iter1: number = 0
    colorGreen.forEach((item, index) => {
      data[iter1 + 1] = greenRes[greenRefactored.indexOf(item)];
      iter1 += 4;
    });

    let blueRes: any = this.mainService.binarisation(blueRefactored, histoBlue);
    let iter2: number = 0
    colorBlue.forEach((item, index) => {
      data[iter2 + 2] = blueRes[blueRefactored.indexOf(item)];
      iter2 += 4;
    });
    this.ctx.putImageData(imageData, 0, 0);
    if(isToStuckInStory) {
      this.setStory("Binarisation", imageData);
      this.getHistogramme();
    }
  }

  onChoose(): void {
    let input: any = document.createElement('input');
    input.type = 'file';
    input.click();

    let self: any = this;
    input.onchange = function(event: any) {
      self.change(event.target.files[0]);
    }
  }

  onGrayNiveau(isToStuckInSTory: boolean) {
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      let moy = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i]     = moy;
      data[i + 1] = moy;
      data[i + 2] = moy;
    }
    this.ctx.putImageData(imageData, 0, 0);
    if(isToStuckInSTory) {
      this.setStory("Niveau de gris", imageData);
      this.getHistogramme();
    }
  }

  onHistoNear(isToStuckInStory): void {
    let colorRed: number[] = [];
    let colorGreen: number[] = [];
    let colorBlue: number[] = [];
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      colorRed.push(data[i]);
      colorGreen.push(data[i + 1]);
      colorBlue.push(data[i + 2]);
    }

    let colorRedRefactored: any = this.mainService.refactorColorData(colorRed);
    let colorGreenRefactored: any = this.mainService.refactorColorData(colorGreen);
    let colorBlueRefactored: any = this.mainService.refactorColorData(colorBlue);

    let histoRed: number[] = this.mainService.calculHisto(colorRedRefactored.histo);
    let histoGreen: number[] = this.mainService.calculHisto(colorGreenRefactored.histo);
    let histoBlue: number[] = this.mainService.calculHisto(colorBlueRefactored.histo);

    let redRefactored: any[] = this.mainService.makeColorArray(colorRedRefactored.histo);
    let greenRefactored: any[] = this.mainService.makeColorArray(colorGreenRefactored.histo);
    let blueRefactored: any[] = this.mainService.makeColorArray(colorBlueRefactored.histo);

    this.mainService.equalizeNearHisto(redRefactored, histoRed)
      .then(
        function(redRes: any) {
          let iter: number = 0
          colorRed.forEach((item, index) => {
            data[iter] = redRes[redRefactored.indexOf(item)];

            iter += 4;
          })
        }
    );

    this.mainService.equalizeNearHisto(greenRefactored, histoGreen)
    .then(
      function(greenRes: any) {
        let iter: number = 0
        colorGreen.forEach((item, index) => {
          data[iter + 1] = greenRes[greenRefactored.indexOf(item)];

          iter += 4;
        })
      }
    );

    let self: any = this;
    this.mainService.equalizeNearHisto(blueRefactored, histoBlue)
    .then(
      function(blueRes: any) {
        let iter: number = 0
        colorBlue.forEach((item, index) => {
          data[iter + 2] = blueRes[blueRefactored.indexOf(item)];

          iter += 4;
        });
        self.ctx.putImageData(imageData, 0, 0);
        if(isToStuckInStory) {
          self.setStory("Egalisation d'histogramme", imageData);
          self.getHistogramme();
        }
      }
    );
  }

  onInversion(isToStuckInStory): void {
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i]     = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    this.ctx.putImageData(imageData, 0, 0);
    if(isToStuckInStory) {
      this.setStory("Inversion de couleur", imageData);
      this.getHistogramme()
    }
  };

  onOpacity(): void {
    this.putOriginal();
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;
    let contrast: number;
    let inter: number = 0;

    contrast = this.opacity;
    contrast = (contrast/100) + 1;
    inter = 128 * (1 - contrast);
    for (let i = 0; i < data.length; i += 4) {
      data[i]     = data[i] * contrast + inter;
      data[i + 1] = data[i + 1] * contrast + inter;
      data[i + 2] = data[i + 2] * contrast + inter;
    }
    this.ctx.putImageData(imageData, 0, 0);
  }

  onLuminosite() {
    this.putOriginal();
    let imageData: any = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let data: any[] = imageData.data;
    let contrast: number;

    contrast = this.opacity;
    for (let i = 0; i < data.length; i += 4) {
      data[i]     += contrast;
      data[i + 1] += contrast;
      data[i + 2] += contrast;
    }
    this.ctx.putImageData(imageData, 0, 0);
  }

  onSaveAs(): void {
    let imageURI: any = this.canvas.nativeElement.toDataURL("image/png", 1.0);
    let a: any = document.createElement('a');
    a.href = imageURI;
    a.download = "myImage.png";
    a.click();
  }

  transformation2D(couleur: any[]): any{
    let result: any[][] = [[]];
    let imageData = this.ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let iteration: number = 0;
    for(let i=0; i < imageData.height; i++){
      let resTemp: any[] = [];
      for(let j=0; j < imageData.width; j++){
        resTemp.push(couleur[iteration]);
        iteration++;
      }
      result[i] = resTemp;
    }
    return result;
  }

  onFiltrageLineaire(nomMasque: string, isMainCanvas: boolean, canvas: any = this.canvas, ctx: any = this.ctx): void{
    let masque: any[][];
    switch (nomMasque) {
      case 'lissage': {
        masque = [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]];
      } break;
      case 'gaussien': {
        masque = [[1 / 16, 2 / 16, 1 / 16], [2 / 16, 4 / 16, 2 / 16], [1 / 16, 2 / 16, 1 / 16]];
      } break;
      case 'convolution': {
        masque = [[-5 , 0, 1], [ -1, -1, -5], [8, -1, 3]];
      } break;
      case 'rehausseur': {
        masque = [[0 , -1, 0], [ -1, 5, -1], [0, -1, 0]];
      } break;
      case 'accentuation': {
        masque = [[0, -0.5, 0], [-0.5, 3, -0.5], [0, -0.5, 0]];
      } break;
      case 'laplacien': {
        masque = [[0, 1, 0], [1, -4, 1] ,[0, 1, 0]];
      } break;
      default:
        masque = [[1, 1, 1], [1, 1, 1] ,[1, 1, 1]];
    }

    let imageData: any;
    if(isMainCanvas) imageData = ctx.getImageData(0, 0, canvas.nativeElement.width, canvas.nativeElement.height)
      else {
        imageData = ctx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
      }
    let data: any[] = imageData.data;

    let colorRed : number[]= [];
    let colorGreen : number[] = [];
    let colorBlue: number[] = [];

    for(let i=0; i < data.length; i+=4){
      colorRed.push(data[i]);
      colorGreen.push(data[i + 1]);
      colorBlue.push(data[i + 2]);
    }

    let colorRed2d: any[][] = this.transformation2D(colorRed);
    let colorGreen2d: any[][] = this.transformation2D(colorGreen);
    let colorBlue2d: any[][] = this.transformation2D(colorBlue);

    let redRes: any[] = this.mainService.filtrageLineaire(colorRed2d,masque);
    let greenRes: any[] = this.mainService.filtrageLineaire(colorGreen2d,masque);
    let blueRes: any[] = this.mainService.filtrageLineaire(colorBlue2d,masque);
    let iter: number = 0;

    for (let i = 0; i < data.length; i+=4) {
      data[i] = redRes[iter];
      data[i + 1] = greenRes[iter];
      data[i + 2] = blueRes[iter];
      iter++;
    }
    ctx.putImageData(imageData, 0, 0);
    if(isMainCanvas) this.getHistogramme();
  }

}
