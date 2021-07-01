preloadImages();
  
Vue.component('game-over-menu',
{
  data: function ()
  {
    return {}
  },
  props:
  {
    winOrLose: String,
    time: Number
  },
  methods:
  {
    message: function ()
    {
      if (this.winOrLose == 'win')
        return 'Congratulations, you win!';
      return 'Sorry, you lose!';
    }
  },
  template: `
  	<div><h3>{{message()}}</h3>
    <p>Time: {{time}} seconds</p>
    
   <p class="modal-footer">
   <button class="modal-default-button" @click="$emit('close')">Close</button>
    
    <button class="modal-default-button" @click="$emit('play')">Play Again</button> 
    </p>
    </div>
  `
});

Vue.component('settings-menu',
{
  data: function ()
  {
    return {
      difficulty: 'easy'
    }
  },
  props:
  {
    level: String
  },
  beforeMount()
  {
    this.difficulty = this.level;
  },
  template: `<div>
  <h3>Change Level for Next Game</h3>
 
 <p>
 <input name="diff" type="radio" id="easy" value="easy" v-model="difficulty" class="modal-input">
  <label for="easy" class="modal-label">Easy: 10 Hearts - 9 x 9 tiles</label>
  <input name="diff" type="radio" id="medium" value="medium" v-model="difficulty" class="modal-input">
  <label for="medium" class="modal-label">Medium: 40 Hearts - 16 x 16 tiles</label>
  <input name="diff" type="radio" id="hard" value="hard" v-model="difficulty" class="modal-input">
  <label for="hard" class="modal-label">Hard: 99 Hearts - 16 x 30 tiles</label>
  </p>
  <p class="modal-footer">
  <button class="modal-default-button" @click="$emit('close')">Cancel</button>
  <button class="modal-default-button" @click="$emit('save', difficulty);$emit('play')">Save</button>
                   </p>     
                        </div>`
});

Vue.component('help-menu',
{
  data: function ()
  {
    return {}
  },
  template: `<div><h3>How to play Heartsweeper</h3>
<p>Click any square to open it. If the square contains a heart, you lose. Your first click is safe. To win, open all the heart free squares without clicking any hearts.</p>

<h3>Tips:</h3><ul>
<li>The numbers show how many hearts are in the eight surrounding squares. You can use this to decide which squares contain hearts.</li><li>If you think a square contains a heart, right-click or Ctrl+Click it.  This puts a flag on the square. Right-click again to make the flag a question mark, and again to set the square back to normal. </li><li>If you've flagged all the hearts by a number, double-click or Shift+Click it. This will open the rest of the surrounding squares. </li></ul>

<p class="modal-footer">
   <button class="modal-default-button" @click="$emit('close')">Close</button>
    </p>

</div>
`
});


Vue.component('modal',
{
  template: `
    <transition name="modal" id="modal-template">
    <div class="modal-mask" @click.self="$emit('close')">    	
      <div class="modal-container">
				<slot name="screen"></slot>
      </div>
    </div>
  </transition>
  `

});


new Vue(
{
  el: '#game-board',
  data:
  {
    board: [],
    gameStarted: false,
    heartLocations: 0,
    coveredTiles: 0,
    heartsLeft: 0,
    clockTime: 0,
    gameStart: new Date(),
    timerID: 0,
    gameEnded: false,
    rows: 9,
    columns: 9,
    hearts: 10,
    tileKey: 0,
    difficulty: "easy",
    showModal: false,
    type: 'settings',
    gameResults:
    {
      winOrLose: 'win',
      time: 0
    }
  },
  created: function ()
  {
    this.coveredTiles = (this.rows * this.columns) - this.hearts;
    this.heartsLeft = this.hearts;
    for (let i = 0; i < this.rows * this.columns; i++)
    {
      this.board.push(
      {
        id: i,
        isHeart: false,
        heartsNearby: 0,
        flagsNearby: 0,
        endOfRow: ((i % this.columns) == 0),
        state: "hidden",
        wrong: false,
        hover: false
      });
    }
  },
  methods:
  {
    openModal: function (menuType, extraData)
    {
      this.showModal = true;
      this.type = menuType;
      if (menuType == 'end')
      {
        this.gameResults.winOrLose = extraData[0];
        this.gameResults.time = extraData[1];
      }
    },
    updateDifficulty: function (difficulty)
    {
      this.showModal = false;
      this.difficulty = difficulty;
      
    },
    leftClick: function (tile)
    {
      if (tile.state == "hidden" && this.gameEnded == false)
      {
        if (this.gameStarted == false)
        {
          this.gameStart = new Date();
          this.calculateTime();
          this.fillInBoard(tile.id);
          this.gameStarted = true;
        }

        if (tile.isHeart == true)
        {
          clearTimeout(this.timerID);
          tile.state = "broken";
          this.gameEnded = true;
          for (let i = 0; i < this.rows * this.columns; i++)
          {
            if (this.board[i].isHeart == true)
            {
              this.board[i].state = "broken";
            }
            if (this.board[i].isHeart == false && this.board[i].state == "flag")
            {
              this.board[i].state = "wrong";
            }
          }
          this.openModal('end', ['Lose', this.clockTime, this.gameStart]);
        }
        else
        {
          tile.state = tile.heartsNearby;
          this.coveredTiles = this.coveredTiles - 1;
          if (tile.heartsNearby == 0)
          {
            let neighbors = this.neighboringSquares(tile.id);

            while (neighbors.length > 0)
            {
              neighborPos = neighbors.pop();
              let neighborTile = this.board.find(tile => tile.id == neighborPos);
              if (neighborTile.state == "hidden")
              {
                neighborTile.state = neighborTile.heartsNearby;
                this.coveredTiles = this.coveredTiles - 1;
                if (neighborTile.heartsNearby == 0)
                {
                  let moreNeighbors = this.neighboringSquares(neighborTile.id);
                  neighbors = neighbors.concat(moreNeighbors);
                }
              }
            }
          }
        }

        if (this.coveredTiles == 0)
        {
          clearTimeout(this.timerID);
          this.gameEnded = true;
          for (let i = 0; i < this.rows * this.columns; i++)
          {
            if (this.board[i].isHeart == true)
            {
              this.board[i].state = "heart";
            }
          }
          this.heartsLeft = 0;
          this.openModal('end', ['win', this.clockTime, this.gameStart]);
        }
      }


    },
    rightClick: function (tile)
    {

      if (this.gameEnded == false)
      {
        let neighbors = this.neighboringSquares(tile.id);
        switch (tile.state)
        {
          case "hidden":
            this.heartsLeft = this.heartsLeft - 1;
            tile.state = "flag";
            for (let q = 0; q < neighbors.length; q++)
            {
              let nTile = this.board.find(nTile => nTile.id == neighbors[q]);
              nTile.flagsNearby = nTile.flagsNearby + 1;
            }
            break;
          case "flag":
            this.heartsLeft = this.heartsLeft + 1;
            for (let q = 0; q < neighbors.length; q++)
            {
              let nTile = this.board[neighbors[q]];
              nTile.flagsNearby = nTile.flagsNearby - 1;
            }
            tile.state = "question";
            break;
          case "question":
            tile.state = "hidden";
            break;
          default:
            break;
        }
      }
    },
    dblClick: function (tile)
    {
      if (this.gameEnded == false)
      {
        switch (tile.state)
        {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
          case 7:
          case 8:
            if (tile.flagsNearby == tile.heartsNearby)
            {
              let neighbors = this.neighboringSquares(tile.id);
              while (neighbors.length > 0)
              {
                let neighborPos = neighbors.pop();
                if (this.board[neighborPos].state != "flag")
                {
                  this.leftClick(this.board[neighborPos]);
                }
              }
            }
            else
            {
              tile.wrong = true;
              this.$nextTick(function ()
              {
                tile.wrong = false;
              })
            }
            break;
        }
      }
    },
    fillInBoard: function (position)
    {
      let noHearts = [];
      noHearts = this.neighboringSquares(position);
      noHearts.push(position);

      let heartCounter = 0;
      while (heartCounter < this.hearts)
      {
        let heartPos = Math.floor(Math.random() * this.rows * this.columns);
        if (!noHearts.includes(heartPos))
        {
          let tile = this.board.find(tile => tile.id == heartPos);
          if (!tile.isHeart)
          {
            tile.isHeart = true;
            heartCounter++;
            let neighbors = this.neighboringSquares(heartPos);
            for (let q = 0; q < neighbors.length; q++)
            {
              let nTile = this.board.find(nTile => nTile.id == neighbors[q]);
              nTile.heartsNearby = nTile.heartsNearby + 1;
            }
          }
        }
      }

    },
    neighboringSquares: function (position)
    {
      let neighborArray = [];
      let squareID = parseInt(position);
      let neighborsAbove = (squareID >= this.columns);
      let neighborsBelow = (squareID < ((this.rows * this.columns) - this.columns));
      let neighborsToLeft = ((squareID % this.columns) != 0);
      let neighborsToRight = (((squareID + 1) % this.columns) != 0);

      if (neighborsAbove)
      {
        if (neighborsToLeft)
        {
          neighborArray.push(squareID - (this.columns + 1));
        }
        neighborArray.push(squareID - this.columns);
        if (neighborsToRight)
        {
          neighborArray.push(squareID - (this.columns - 1));
        }
      }
      if (neighborsToLeft)
      {
        neighborArray.push(squareID - 1);
      }
      if (neighborsToRight)
      {
        neighborArray.push(squareID + 1);
      }
      if (neighborsBelow)
      {
        if (neighborsToLeft)
        {
          neighborArray.push(squareID + (this.columns - 1));
        }
        neighborArray.push(squareID + this.columns);
        if (neighborsToRight)
        {
          neighborArray.push(squareID + (this.columns + 1));
        }
      }

      return neighborArray;
    },
    isCovered: function (tile)
    {
      switch (tile.state)
      {
        case "hidden":
        case "flag":
        case "question":
        case "heart":
          if (!this.gameEnded)
            return true;
          else return false;
          break;
        default:
          return false;
          break;
      }
    },
    isRevealed: function (tile)
    {
      switch (tile.state)
      {
        case "hidden":
        case "flag":
        case "question":
        case "heart":
          return false;
          break;
        default:
          return true;
          break;
      }
    },
    isOver: function (tile)
    {
      if (this.gameEnded)
      {
        switch (tile.state)
        {
          case "hidden":
          case "flag":
          case "question":
          case "heart":
            return true;
            break;
          default:
            return false;
            break;
        }
      }
      else
      {
        return false;
      }
    },
    heartCountDisplay: function ()
    {
      return this.heartsLeft < 0 ? 0 : this.heartsLeft;
    },
    clockTimeDisplay: function ()
    {
      return this.clockTime > 9999 ? "9999" : this.formatTime(this.clockTime)
    },
    calculateTime: function ()
    {
      let rightNow = new Date();
      this.clockTime = Math.floor(Math.abs(rightNow - this.gameStart) / 1000);
      this.timerID = setTimeout(this.calculateTime, 500);

    },
    formatTime: function (i)
    {
      if (i < 10)
      {
        i = "0" + i
      };
      if (i < 100)
      {
        i = "0" + i
      };
      if (i < 1000)
      {
        i = "0" + i
      };
      return i;
    },
    startNewGame: function ()
    {
      this.showModal = false;

      this.clockTime = 0;
      this.gameStart = new Date();
      this.gameStarted = false;
      this.gameEnded = false;
      if (this.difficulty == "easy")
      {
        this.rows = 9;
        this.columns = 9;
        this.hearts = 10;
        this.coveredTiles = 71;
      }
      if (this.difficulty == "medium")
      {
        this.rows = 16;
        this.columns = 16;
        this.hearts = 40;
        this.coveredTiles = 216;
      }
      if (this.difficulty == "hard")
      {
        this.rows = 16
        this.columns = 30
        this.hearts = 99;
        this.coveredTiles = 381;
      }

      this.heartLocations = 0;
      this.heartsLeft = this.hearts;
      let newBoard = [];
      for (let i = 0, j = this.rows * this.columns; i < j; i++)
      {
        newBoard.push(
        {
          id: i,
          isHeart: false,
          heartsNearby: 0,
          flagsNearby: 0,          
          endOfRow: ((i % this.columns) == 0),
          state: "hidden",
          wrong: false,
          hover: false
        });

      }
      this.board= newBoard;
      if(! this.timerID===0){
        clearTimeout(timerID);
      }
  
      
    }
  },
  template: `<div> 
                       <div>
      <modal v-if="showModal" @close="showModal = false">
        <div slot="screen" v-if="type == 'end'">
          <game-over-menu @close="showModal = false" @play="startNewGame" v-bind="gameResults"></game-over-menu>   
        </div>
        <div slot="screen" v-else-if="type == 'settings'">
          <settings-menu @close="showModal = false" @save="updateDifficulty" v-bind:level="difficulty"></settings-menu>
        </div>
        <div slot="screen" v-else-if="type == 'help'">
          <help-menu @close="showModal = false"></help-menu>
        </div>
      </modal>
    </div>
                        <div  v-bind:style="{'min-width':columns*34+'px','display': 'inline-block', 'background':'#f5fffa', 'border':'4px solid rgb(243, 200, 175)', 'box-shadow': '0 2px 2px 0 rgb(243, 200, 175)'}">
                        <div class="top" v-bind:style="{'min-width':((columns*34)-2)+'px'}">
                          <div class="menuCol"><button class="menuButtons" v-on:click="startNewGame()">New Game</button></div>
                          <div class="menuCol"><button class="menuButtons" v-on:click="openModal('settings')">Settings</button></div>
                          <div class="menuCol"><button class="menuButtons" v-on:click="openModal('help')">Help</button></div>
                        </div>
                        <div class="square" 
                        v-for="(tile, position) in board"

                       
                        v-on:click.left.exact="leftClick(tile)"
                        v-on:click.left.ctrl.exact="rightClick(tile)"
                        v-on:click.left.shift.exact="dblClick(tile)"
                        v-on:click.right.prevent="rightClick(tile)"
                        v-on:dblclick="dblClick(tile)"
                        v-bind:class="{end: tile.endOfRow, covered: isCovered(tile), revealed: isRevealed(tile), over: isOver(tile)}"
                        
                       >
                          <img v-bind:src="'images/'+tile.state+'.png'" >   
                          <transition name="flashx">
                            <img v-if="tile.wrong" src="images/x.png" class="blinking-x">   
                          </transition>
                        </div>
                        <div class="bottom" v-bind:style="{'min-width':((columns*34)-2)+'px'}">
                          <div class="time"><img class="clockImg" src="images/clock.png"><div class="time-counter">{{clockTimeDisplay()}}</div></div>  
                          <div class="hearts "><div class="heart-counter">{{heartCountDisplay()}}</div><img class="heartImg" src="images/hearts.png"></div>
                        </div>
                      </div>         
                   
                    </div>`
});

function preloadImages(){
  img1 = new Image();
  img2 = new Image();
  img3 = new Image();
  img4 = new Image();
  img5 = new Image();
  img6 = new Image();
  img7 = new Image();
  img8 = new Image();
  img9 = new Image();
  img10 = new Image();
  img11 = new Image();
  img12 = new Image();
  img13 = new Image();
  img14 = new Image();
  img15 = new Image();
  img16 = new Image();
  img17 = new Image();
  img18 = new Image();

  img1.src = "images/0.png";
  img2.src = "images/1.png";
  img3.src = "images/2.png";
  img4.src = "images/3.png";
  img5.src = "images/4.png";
  img6.src = "images/5.png";
  img7.src = "images/6.png";
  img8.src = "images/7.png";
  img9.src = "images/8.png";
  img10.src = "images/broken.png";
  img11.src = "images/clock.png";
  img12.src = "images/flag.png";
  img13.src = "images/heart.png";
  img14.src = "images/hearts.png";
  img15.src = "images/hidden.png";
  img16.src = "images/question.png";
  img17.src = "images/wrong.png";
  img18.src = "images/x.png";
}

