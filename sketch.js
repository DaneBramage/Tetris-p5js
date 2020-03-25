function setup() {
  createCanvas(620, 660);
  grid.generateGrid(12, 20);
  tetromino.newPiece(); 
  angleMode(DEGREES);
}

function draw() {
  background(0, 0, 80);
  grid.drawGrid();
  tetromino.updatePos();
  tetromino.draw();
  tetromino.fallPiece(fallDelay);
  keyboardControls();
  speedIncrease(1);
  lineFlash.draw();
  updateScore();
}

let fallDelay = 500; // fall speed
let softDropDelay = 40; // soft-drop speed
let originalDelay = fallDelay; // Don't modify
let score = 0;

function speedIncrease(rate) {
  originalDelay -= (deltaTime/1000) * rate;
}

function gameOver() {
  fill('rgba(0, 0, 0, 0.7)');
  rect(0, 0, width, height);
  fill(255);
  textSize(60);
  stroke(0);
  strokeWeight(5);
  text("GAME OVER", width / 5, height / 2);
  noLoop();
}

function updateScore() {
  push();
  //fill(70, 125, 225);
  fill(0);
  stroke(255);
  strokeWeight(5);
  rect((grid.columns + 2) * grid.cellSize, grid.cellSize + 2.5, grid.cellSize * 5, grid.cellSize * 4); // The + modifier in y position argument should be half of strokeWeight (e.g.: 5 and 2.5)
  fill(255);
  noStroke();
  textStyle(BOLD);
  textSize(32);
  text("Score:", (grid.columns + 2.8) * grid.cellSize, grid.cellSize * 2.5);
  textStyle(NORMAL);
  text(score.toString(10), (grid.columns + 2.8) * grid.cellSize, grid.cellSize * 4); // 10 is base-ten
  
  textSize(18);
  text("CONTROLS:", (grid.columns + 2) * grid.cellSize, grid.cellSize * (grid.rows / 3));
  textSize(12);
  text("LEFT ARROW / A: Move left", (grid.columns + 2) * grid.cellSize, grid.cellSize * ((grid.rows / 3) + 1));
  text("RIGHT ARROW / D: Move right", (grid.columns + 2) * grid.cellSize, grid.cellSize * ((grid.rows / 3) + 1.75));
  text("UP ARROW / W: Rotate piece", (grid.columns + 2) * grid.cellSize, grid.cellSize * ((grid.rows / 3) + 2.5));
  text("DOWN ARROW / S: Soft drop", (grid.columns + 2) * grid.cellSize, grid.cellSize * ((grid.rows / 3) + 3.25));
  
  textSize(12);
  text("Coded by: Dane Hartman", (grid.columns + 1.75) * grid.cellSize, grid.cellSize * (grid.rows - 1));
  text("CS Teacher @ Wheat Ridge HS", (grid.columns + 1.75) * grid.cellSize, grid.cellSize * (grid.rows - 0.5));
  text("wrhstech.org", (grid.columns + 1.75) * grid.cellSize, grid.cellSize * (grid.rows));
  text("Shout out to p5js devs & community", (grid.columns + 1.75) * grid.cellSize, grid.cellSize * (grid.rows + 1));
  pop();
}

let lineFlash = {
  lineList: [], // Gets set at time of row completion
  R: 255,
  G: 255,
  B: 255,
  A: 0, // Gets set to 255 at time of row completion (then fades out)
  draw: function() {
    noStroke();
    fill(this.R, this.G, this.B, this.A);
    if (this.lineList.length > 0) {
      for (i = 0; i < this.lineList.length; i++) {
        rect(grid.gridArray[1][this.lineList[i]].cellX, grid.gridArray[1][this.lineList[i]].cellY, grid.cellSize * (grid.columns - 2), grid.cellSize);
        this.A -= deltaTime / this.lineList.length; // Makes effect fade out, compensates for multiple-line fade acceleration
      }
    }
  }
}

function keyboardControls() { // SOFT DROP
    if ((keyIsDown(DOWN_ARROW) || keyIsDown(83)) && tetromino.softDropTimeout > 250) {
      fallDelay = softDropDelay; //
    }
    else {
      fallDelay = originalDelay; // make sure this is the same as fallDelay
    }
  }

function keyPressed() {
  if (keyCode === UP_ARROW || keyCode === 87) { // 87 is W
    tetromino.rotatePiece("counterclock");
  }
  if (keyCode === LEFT_ARROW || keyCode === 65) { // 65 is A
    tetromino.movePiece("left");
  } else if (keyCode === RIGHT_ARROW || keyCode === 68) { // 68 is D
    tetromino.movePiece("right");
  }
  return false; // Prevents any default behavior from browser
}

function collisionCheck(direction) {
  let collisionRotate = false;
  let collisionDown = false;
  let collisionLeft = false;
  let collisionRight = false;
  for (let i = 0; i < 4; i++) { // Tetrominos always have 4 cells
    for (let x = 0; x < grid.columns; x++) {
      for (let y = 0; y < grid.rows; y++) {
        if (grid.gridArray[tetromino.currentCells[i].x][tetromino.currentCells[i].y + 1].occupied === true) {
          collisionDown = true;
        }
        if (grid.gridArray[tetromino.currentCells[i].x - 1][tetromino.currentCells[i].y].occupied === true) {
          collisionLeft = true;
        }
        if (grid.gridArray[tetromino.currentCells[i].x + 1][tetromino.currentCells[i].y].occupied === true) {
          collisionRight = true;
        }
        if (direction === "rotate") { // only check rotation if requested (prevent initially-undefined turnPos bug)
          if (grid.gridArray[tetromino.turnPos[i].x][tetromino.turnPos[i].y].occupied === true) {
            collisionRotate = true;
          }
        }
      }
    }
  }
  if (direction === "down") {
    return collisionDown;
  }
  if (direction === "left") {
    return collisionLeft;
  }
  if (direction === "right") {
    return collisionRight;
  }
  if (direction === "rotate") {
    return collisionRotate;
  }
}

let tetromino = {
  xPos: 6, // Valuee unused, set by newPiece() method
  yPos: 3, // Valuee unused, set by newPiece() method
  orient: 3, // four values, each corresponds to a rotation state
  currentPiece: undefined, // Keeps track of current piece type to prevent repeats
  // colorOptions: ["#FF6666", "#33DD33", "#6666FF", "#CC66FF", "#FFCC11"], // Legacy random color
  // red, green, blue, purple, orange
  color: "#000000",
  fallTimer: 0, // used with Delta time to control fall speed
  softDropTimeout: 0, // used with Delta time to prevent immediate soft drop on new piece
  activeShape: [], // the currently active shape array
  turnPos: [], // contains future position array AFTER proposed rotation (for collision check)
  shapeOptions: ["L", "RL", "S", "Z", "RZ", "I", "T"],
  
  shapeArrayL: [ // rotation orientations for L piece
    [{x:0,y:0},{x:0,y:-1},{x:0,y:1},{x:1,y:1}],
    [{x:0,y:0},{x:-1,y:0},{x:1,y:0},{x:1,y:-1}],
    [{x:0,y:0},{x:0,y:-1},{x:0,y:1},{x:-1,y:-1}],
    [{x:0,y:0},{x:1,y:0},{x:-1,y:0},{x:-1,y:1}],
  ],
    shapeArrayRL: [ // rotation orientations for reverse L piece
    [{x:0,y:0},{x:0,y:-1},{x:0,y:1},{x:-1,y:1}],
    [{x:0,y:0},{x:-1,y:0},{x:1,y:0},{x:1,y:1}],
    [{x:0,y:0},{x:0,y:-1},{x:0,y:1},{x:1,y:-1}],
    [{x:0,y:0},{x:1,y:0},{x:-1,y:0},{x:-1,y:-1}],
  ],
    shapeArrayS: [ // rotation orientations for square piece (all identical)
    [{x:0,y:0},{x:0,y:-1},{x:-1,y:0},{x:-1,y:-1}],
    [{x:0,y:0},{x:0,y:-1},{x:-1,y:0},{x:-1,y:-1}],
    [{x:0,y:0},{x:0,y:-1},{x:-1,y:0},{x:-1,y:-1}],
    [{x:0,y:0},{x:0,y:-1},{x:-1,y:0},{x:-1,y:-1}],
  ],
    shapeArrayZ: [ // rotation orientations for Z piece
    [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:-1,y:1}],
    [{x:0,y:0},{x:0,y:-1},{x:1,y:0},{x:1,y:1}],
    [{x:0,y:0},{x:0,y:-1},{x:-1,y:0},{x:1,y:-1}],
    [{x:0,y:0},{x:0,y: 1},{x:-1,y:0},{x:-1,y:-1}],
  ],
    shapeArrayRZ: [ // rotation orientations for reverse Z piece
    [{x:0,y:0},{x:-1,y:0},{x:0,y:1},{x:1,y:1}],
    [{x:0,y:0},{x:0,y:1},{x:1,y:0},{x:1,y:-1}],
    [{x:0,y:0},{x:0,y:-1},{x:-1,y:-1},{x:1,y:0}],
    [{x:0,y:0},{x:0,y:-1},{x:-1,y:0},{x:-1,y:1}],
  ],
    shapeArrayI: [ // rotation orientations for I piece
    [{x:0,y:0},{x:0,y:-1},{x:0,y:1},{x:0,y:2}],
    [{x:0,y:0},{x:-1,y:0},{x:1,y:0},{x:2,y:0}],
    [{x:0,y:0},{x:0,y:1},{x:0,y:-1},{x:0,y:-2}],
    [{x:0,y:0},{x:1,y:0},{x:-1,y:0},{x:-2,y:0}],
  ],
    shapeArrayT: [ // rotation orientations for T piece
    [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:0,y:-1}],
    [{x:0,y:0},{x:-1,y:0},{x:1,y:0},{x:0,y:-1}],
    [{x:0,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}],
    [{x:0,y:0},{x:0,y:1},{x:-1,y:0},{x:1,y:0}],
  ],
  currentCells: [], // cell coordinates of current tetromino, pushed by updatePos()
  changeType: function(shape) {
    this.xPos = 6; // Set starting position of Tetrominos
    this.yPos = 2; // Set starting position of Tetrominos
    if (shape === "L") {
      this.activeShape = this.shapeArrayL;
      this.color = "red"; // red
    }
    else if (shape === "RL") {
      this.activeShape = this.shapeArrayRL;
      this.color = "green"; // green
    }
    else if (shape === "S") {
      this.activeShape = this.shapeArrayS;
      this.color = "blue"; // blue
    }
    else if (shape === "Z") {
      this.activeShape = this.shapeArrayZ;
      this.color = "purple"; // purple
    }
    else if (shape === "RZ") {
      this.activeShape = this.shapeArrayRZ;
      this.color = "orange"; // orange
    }
    else if (shape === "I") {
      this.activeShape = this.shapeArrayI;
      this.color = "yellow"; // yellow
      //this.yPos ++; // Moves "I" piece down one to prevent off-grid rotate bug
    }
    else if (shape === "T") {
      this.activeShape = this.shapeArrayT;
      this.color = "light blue"; // light blue
    }
  },
  newPiece: function() {
    grid.bonus = 0; // Reset multi-line bonus to 0 when new piece appears
    let nextPiece = random(this.shapeOptions);
    if (nextPiece !== this.currentPiece) { // Prevents repeats of the same piece
      this.changeType(nextPiece);
      this.currentPiece = nextPiece;
    }
    else {
      this.newPiece();
    }
  },
  
  updatePos: function() {
    this.currentCells = []; // clear value of currentCells
    for (let i = 0; i < 4; i++) { // iterate through all four cells of a Tetromino
      this.currentCells.push({ // populate the currentCells array using activeShape and current orientation
        x: this.xPos + this.activeShape[this.orient][i].x, // calculate actual positions using xPos and piece array
        y: this.yPos + this.activeShape[this.orient][i].y // calculate actual positions using yPos and piece array
      });
    }
  },

  draw: function() {
    grid.resetAllCells();
    grid.gridBorder(grid.rows, grid.columns);
    for (let i = 0; i < 4; i++) { // Tetrominos always have 4 cells
      grid.setCellState(this.currentCells[i].x, this.currentCells[i].y, this.color, undefined); // don't set occupied state
    }
  },

  rotatePiece: function(dir) {
    if (dir === "clock" && this.orient > 0) {
      this.turnPos = []; // clear turnPos
      for (let i = 0; i < 4; i++) { // iterate through four cells of tetromino
        this.turnPos.push({ // populate turnPos with the rotated shape for collision testing
          x: this.xPos + this.activeShape[this.orient - 1][i].x, // -1 pushes requested rotation state
          y: this.yPos + this.activeShape[this.orient - 1][i].y
        });
      }
      if (collisionCheck("rotate") === false) {
        this.orient--;
      }
    } else if (dir === "clock" && this.orient === 0) {
      this.turnPos = []; // clear turnPos
      for (let i = 0; i < 4; i++) { // iterate through four cells of tetromino
        this.turnPos.push({ // populate turnPos with the rotated shape for collision testing
          x: this.xPos + this.activeShape[3][i].x, // 3 pushes requested rotation state
          y: this.yPos + this.activeShape[3][i].y
        });
      }
      if (collisionCheck("rotate") === false) {
        this.orient = 3;
      }
    } else if (dir === "counterclock" && this.orient < 3) {

      this.turnPos = []; // clear turnPos
      for (let i = 0; i < 4; i++) { // iterate through four cells of tetromino
        this.turnPos.push({ // populate turnPos with the rotated shape for collision testing
          x: this.xPos + this.activeShape[this.orient + 1][i].x, // +1 pushes requested rotation state
          y: this.yPos + this.activeShape[this.orient + 1][i].y
        });
      }
      if (collisionCheck("rotate") === false) {
        this.orient++;
      }

    } else if (dir === "counterclock" && this.orient === 3) {
      this.turnPos = []; // clear turnPos
      for (let i = 0; i < 4; i++) { // iterate through four cells of tetromino
        this.turnPos.push({ // populate turnPos with the rotated shape for collision testing
          x: this.xPos + this.activeShape[0][i].x, // 3 pushes requested rotation state
          y: this.yPos + this.activeShape[0][i].y
        });
      }
      if (collisionCheck("rotate") === false) {
        this.orient = 0;
      }
    }
  },

  movePiece: function(dir) {
    if (dir === "left" && collisionCheck("left") === false) {
      this.xPos--;
    }
    if (dir === "right" && collisionCheck("right") === false) {
      this.xPos++;
    }
  },

  fallPiece: function(delay) {
    this.fallTimer += deltaTime;
    this.softDropTimeout += deltaTime;
    if (this.fallTimer > delay) {
      if (collisionCheck("down") === false) {
        this.yPos += 1;
        this.fallTimer = 0;
      } else if (collisionCheck("down") === true) {
        if (this.yPos < 3) {
          console.log("You lose");
          gameOver();
        }
        for (let i = 0; i < 4; i++) { // piece has landed, make cells occuiped
          grid.setCellState(this.currentCells[i].x, this.currentCells[i].y, this.color, true);
          this.softDropTimeout = 0;
        }
        grid.clearRows();
        this.newPiece(); // create a new piece
        this.fallTimer = 0;
      }
    }
  },
}

let grid = {
  cellSize: 30,
  offsetX: 30,
  offsetY: 30,
  columns: undefined,
  rows: undefined,
  gridArray: [],
  defaultColor: "background", // game grid background color
  borderHue: 40,
  bonus: 0,
  generateGrid: function(columns, rows) {
    this.columns = columns;
    this.rows = rows;
    for (let x = 0; x < columns; x++) {
      this.gridArray.push([]);
      for (let y = 0; y < rows; y++) {
        this.gridArray[x].push({
          cellX: x * this.cellSize + this.offsetX,
          cellY: y * this.cellSize + this.offsetY,
          color: this.defaultColor,
          occupied: false
        });
      }
    }
  },

  drawGrid: function() {
    for (let x = 0; x < this.columns; x++) {
      for (let y = 0; y < this.rows; y++) {
        square3d(this.gridArray[x][y].cellX, this.gridArray[x][y].cellY, this.cellSize, 0.15, this.gridArray[x][y].color);
      }
    }
  },

  resetAllCells: function() {
    for (let x = 0; x < this.columns; x++) {
      for (let y = 0; y < this.rows; y++) {
        if (this.gridArray[x][y].occupied === false) {
        this.gridArray[x][y].color = this.defaultColor;
        }
      }
    }
  },

  gridBorder: function(bottomY, rightX) {
    for (let x = 0; x < this.columns; x++) {
      for (let y = 0; y < this.rows; y++) {
        this.gridArray[x][0].occupied = false; // Top edge of border not for collision
        this.gridArray[x][bottomY - 1].occupied = true;
        this.gridArray[0][y].occupied = true;
        this.gridArray[rightX - 1][y].occupied = true;
      }
    }
    push();
    colorMode(HSB);
    stroke(this.borderHue, 50, 50);
    fill(this.borderHue, 60, 80); // right and left inside border (area not covered by quads)
    rect(this.offsetX, this.offsetY, this.cellSize, this.rows * this.cellSize);
    rect(this.offsetX + (this.columns - 1) * this.cellSize, this.offsetY, this.cellSize, this.offsetY + (this.rows - 1) * this.cellSize);
    fill(this.borderHue, 10, 100); //Border top outside (highlight)
    quad(this.offsetX, this.offsetY, this.offsetX + this.cellSize / 2, this.offsetY + this.cellSize / 2, this.offsetX + (this.columns - 0.5) * this.cellSize, this.offsetY + this.cellSize / 2, this.offsetX + this.columns * this.cellSize, this.offsetY); // Border top outside
    push(); // Begin transform for outside bottom border
    fill(this.borderHue, 100, 30); // Border bottom outside (shadow);
    translate((this.columns + 2) * this.cellSize, (this.rows + 2) * this.cellSize);
    rotate(180);
    quad(this.offsetX, this.offsetY, this.offsetX + this.cellSize / 2, this.offsetY + this.cellSize / 2, this.offsetX + (this.columns - 0.5) * this.cellSize, this.offsetY + this.cellSize / 2, this.offsetX + this.columns * this.cellSize, this.offsetY); // Border buttom outside (via translate)
    pop(); // end transform for outside bottom border
    fill(this.borderHue, 100, 30); // Top border inside (shadow)
    quad(this.offsetX + this.cellSize / 2, this.offsetY + this.cellSize / 2, this.offsetX + this.cellSize, this.offsetY + this.cellSize, this.offsetX + (this.columns - 1) * this.cellSize, this.offsetY + this.cellSize, this.offsetX + (this.columns - 0.5) * this.cellSize, this.offsetY + this.cellSize * 0.5); // Border top inside
    push(); // Begin transform for inside bottom border (highlight)
    fill(this.borderHue, 15, 100);
    translate((this.columns + 2) * this.cellSize, (this.rows + 2) * this.cellSize);
    rotate(180);
    quad(this.offsetX + this.cellSize / 2, this.offsetY + this.cellSize / 2, this.offsetX + this.cellSize, this.offsetY + this.cellSize, this.offsetX + (this.columns - 1) * this.cellSize, this.offsetY + this.cellSize, this.offsetX + (this.columns - 0.5) * this.cellSize, this.offsetY + this.cellSize * 0.5); // Border bottom inside (via transform)
    pop();
    fill(this.borderHue, 100, 50);
    quad(this.offsetX, this.offsetY, this.offsetX, this.offsetY + this.cellSize * this.rows, this.offsetX + this.cellSize / 2, this.offsetY + this.cellSize * (this.rows - 0.5), this.offsetX + this.cellSize / 2, this.offsetY + this.cellSize / 2); // left outside border
    push(); // Begin transform for right outside border
    translate((this.columns + 2) * this.cellSize, (this.rows + 2) * this.cellSize);
    rotate(180);
    quad(this.offsetX, this.offsetY, this.offsetX, this.offsetY + this.cellSize * this.rows, this.offsetX + this.cellSize / 2, this.offsetY + this.cellSize * (this.rows - 0.5), this.offsetX + this.cellSize / 2, this.offsetY + this.cellSize / 2); // right outside border (via transform)
    pop(); // end transform for right outside border
    pop(); // end HSB color mode
    this.borderHue += 0.1;
    if (this.borderHue > 359) {
      this.borderHue = 0;
    }
  },


  setCellState: function(x, y, color, occupied) {
    this.gridArray[x][y].color = color;
    if (occupied === true) {
      this.gridArray[x][y].occupied = true;
    }
    if (occupied === false) {
      this.gridArray[x][y].occupied = false;
    }
  },
  
  clearRows: function() {
    lineFlash.lineList = []; // Clear lineFlash list before adding lines
    for (let r = 0; r < 4; r++) { // repeats row-check four times, the max number of clearable lines in one drop
      // FOR LOOP BELOW HAS TO RUN TWICE, THE FIRST TIME TO ADD ALL ROWS TO FLASH EFFECT BEFORE THEY GET DELETED IN THE NEXT ONE
      for (let row = this.rows -2; row > 2; row--) { // -2 and 2 ignore grid border (not 1 or -1 due to reverse order iteration)
        if (this.checkRow(row) === this.columns -2) { // if number of occupied cells equals grid width (excl. border), row is full 
          lineFlash.lineList.push(row); // Adds row to list for flash effect
        }
      }
      for (let row = this.rows -2; row > 2; row--) {
        if (this.checkRow(row) === this.columns -2) { // if number of occupied cells equals grid width (excl. border), row is full 
          score += (10 + this.bonus); // Increase score by 10 plus bonus
          this.bonus += 10; // Bonus increases with each line cleared in one drop
          lineFlash.A = 255;
          let gridArrayTemp = this.gridArray;
          for (let x = 1; x < this.columns -1; x++) { // 1 and -1 ignore the grid border
            for (let y = row; y > 1; y--) {
              this.setCellState(x, y, gridArrayTemp[x][y-1].color, gridArrayTemp[x][y-1].occupied);
            }    
          }
        }
      }
    }
  },
  
  checkRow: function(row) { // Checks an input row for number of occupied cells
    let rowCellsOccupied = 0;
      for (let x = 1; x < this.columns -1; x++) { // 1 and -1 ignore the grid border
        if (this.gridArray[x][row].occupied === true) {
          rowCellsOccupied++;
        }
      }
    return rowCellsOccupied; // Returns occupied cells in row
  },
}

function square3d(x, y, size, depth, color) {
  noStroke();
  let R = 0;
  let G = 0;
  let B = 0;
  if (color === "red") {
    R = 240;
    G = 30;
    B = 30;
  }
  if (color === "blue") {
    R = 60;
    G = 60;
    B = 255;
  }
  if (color === "light blue") {
    R = 150;
    G = 150;
    B = 255;
  }
  if (color === "green") {
    R = 30;
    G = 225;
    B = 30;
  }
  if (color === "yellow") {
    R = 225;
    G = 225;
    B = 0;
  }
  if (color === "orange") {
    R = 255;
    G = 150;
    B = 0;
  }
  if (color === "purple") {
    R = 200;
    G = 0;
    B = 255;
  }
  if (color === "background") {
    R = 0;
    G = 0;
    B = 0;
  }
  if (color === "border") {
    R = 70;
    G = 125;
    B = 225;
  }
  if (color !== "background" && color !== "border") {
  stroke(R, G, B);
  fill(R - 30, G - 30, B - 30); // Left shadow
  quad(x, y, x, y + size, x + size * depth, y + size * (1 - depth), x + size * depth, y + size * depth); // Left edge
  fill(R + 140, G + 140, B + 140); // Top highlight
  quad(x, y, x + size, y, x + size * (1 - depth), y + size * depth, x + size * depth, y + size * depth); // Top edge
  fill(R - 30, G - 30, B - 30); // Right shadow
  quad(x + size, y, x + size, y + size, x + size * (1 - depth), y + size * (1 - depth), x + size * (1 - depth), y + size * depth); // Right edge
  fill(R - 90, G - 90, B - 90); // Right shadow
  quad(x, y + size, x + size, y + size, x + size * (1 - depth), y + size * (1 - depth), x + size * depth, y + size * (1 - depth)); // Bottom edge
  fill(R, G, B);
  quad(x + size * depth, y + size * depth, x + size * (1 - depth), y + size * depth, x + size * (1 - depth), y + size * (1 - depth), x + size * depth, y + size * (1 - depth)); // Center square
  }
  else if (color === "background") {
    stroke(R, G, B);
    fill(R, G, B);
    rect(x, y, size, size);
  }
  else if (color === "border") {
    stroke(R, G, B);
    fill(R, G, B);
    rect(x, y, size, size);
  }    
}