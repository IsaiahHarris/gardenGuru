import { Component, OnInit, HostListener } from '@angular/core';
import { BackendService } from '../../Services/backend.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SessionService } from '../../Services/session.service';
@Component({
  templateUrl: './stand.component.html',
  styleUrls: ['./stand.component.scss']
})
export class StandComponent implements OnInit {
  urlId;
  crops;
  user;
  standOwner: object;
  correctUser: boolean = false;
  hasStand: boolean = false;
  isEdit: boolean = false;
  buildStand: boolean;
  garden;
  showingGarden: boolean = false;
  cropId: string;
  check: boolean = true;
  openMessage: boolean = false;
  conversationId: boolean = false;
  messageSentPopUp = ''
  postingCrop: boolean = false;

  //crop photo values
  cropPhotos: string[] = [];
  //holds photos to upload
  photosToStand: File[] = [];
  //holds photos to carry over to stand
  selectedForStand: string[] = [];

  standFormdata: {
    stand_name: string;
  } = {
      stand_name: ''
    };

  moveFormData = {
    description: '',
    details: '',
    price: '',
    inventory: '',
    check: this.check
  };

  message: {
    content: string;
  } = {
      content: ''
    };

  postFormData: {
    plant: number;
    description: string,
    price: string,
    inventory: number,
    details: string,
    photos: File[]
  } = {
      plant: 0,
      description: '',
      price: '',
      inventory: null,
      details: '',
      photos: []
    }

  plants: any;

  @HostListener('click', ['$event'])
  clickout(event) {
    if (event.target === document.getElementById('modal-container')) {
      this.showingGarden = !this.showingGarden;
    }

    if (event.target === document.getElementById('message-modal-container')) {
      console.log('clicked')
      this.openMessage = !this.openMessage;
    }
    if (event.target === document.getElementById('add-modal-container')) {
      this.postingCrop = !this.postingCrop
    }
  }



  constructor(
    private backend: BackendService,
    private router: Router,
    private route: ActivatedRoute,
    private session: SessionService
  ) {
    router.events.subscribe(val => {
      this.ngOnInit();
    });
    this.user = session.getSession();
  }

  sendMessage() {
    this.backend.sendMessage(this.message, this.urlId).then(result => {
      this.openMessage = false;
      this.message.content = '';
      this.messageSentPopUp = 'Message Sent!';
      console.log(this.messageSentPopUp);
    });
  }

  ngOnInit() {
    this.messageSentPopUp = '';
    this.urlId = this.route.snapshot.paramMap.get('id');
    //checks to see if the page belongs to logged in user
    if (parseInt(this.urlId) === this.user.id) {
      this.correctUser = true
    }
    //get the stand
    return this.backend.getStand(this.urlId)
      .then(result => {
        //if the user's stand doesn't exist/no stand
        if (result['message'] && !this.user) {
          return this.hasStand = true;
        } else if (result['message'] && this.correctUser) {
          return this.hasStand = false;
        } else {
          this.hasStand = true;
          this.standOwner = result[0].user;
          this.sortCrops(result);
          let resultArr = Object.values(result);
          resultArr.map(crop => {
            if (crop.photo.length > 0) {
              crop.displayPhoto = crop.photo[0].link;
            }
          })
        }
      })
      .then(() => {
        this.backend.getGarden()
          .then(result => {
            this.garden = result;
            this.garden.map(crop => {
              if (crop.photo.length > 0) {
                crop['mainPhoto'] = crop.photo[0].link
              }
            })
          })
      })
  }

  addToStand() {
    return this.backend.postDirectlyToStand(this.postFormData)
      .then(result => {
        this.showPostForm();
        this.ngOnInit()
      })
  }

  toggleCheck() {
    this.check = !this.check;
    this.moveFormData.check = !this.moveFormData.check;
  }

  moveToStand() {
    this.moveFormData['selectedForStand'] = this.selectedForStand;
    this.moveFormData['uploadForStand'] = this.photosToStand;
    this.backend
      .moveToStand(this.cropId, this.moveFormData)
      .then(response => {
        this.backend
          .getGarden()
          .then(result => (this.garden = result))
          .then(() => {
            this.ngOnInit();
            this.showGarden();
          });
      })
      .catch(err => console.log(err.message));
  }

  isLoggedIn() {
    return this.session.isLoggedIn;
  }

  turnEditToFalse() {
    this.isEdit = false;
  }

  toggleEdit(crop) {
    if (crop) {
      this.cropId = crop.id;
    }
    if (this.isEdit) {
      this.isEdit = !this.isEdit;
    }
    this.garden.map(crop => {
      if (crop.id === this.cropId) {
        this.moveFormData = crop;
        this.cropPhotos = crop.photo;
      }
    });
    this.isEdit = !this.isEdit;
  }

  buildingStand() {
    if (this.buildStand) {
      return (this.buildStand = false);
    }
    return (this.buildStand = true);
  }

  showGarden() {
    if (this.showingGarden) {
      return (this.showingGarden = false);
    }
    return (this.showingGarden = true);
  }

  sortCrops(result) {
    this.crops = result.sort(function (a, b) {
      var textA = a.description;
      var textB = b.description;
      return textA > textB;
    });
  }

  deleteCrop(id) {
    this.backend.deleteCrop(id).then(result => {
      this.ngOnInit();
    });
  }

  editUser() {
    this.backend.editUser(this.standFormdata).then(result => {
      this.user.stand_name = result['stand_name'];
      this.session.setSession(this.user);
      this.hasStand = false;
      this.ngOnInit();
    });
  }

  showPostForm() {
    if (this.postingCrop) {
      return this.postingCrop = false;
    }
    this.backend.getPlants()
      .then(result => {
        this.plants = result;
        return this.postingCrop = true;
      })
  }

  startConversation() {
    console.log('openMessage')
    this.openMessage = !this.openMessage;
    console.log(this.openMessage)
  }

  //photo functions
  selectPhoto(event) {
    if (!this.selectedForStand.includes(event.target.src)) {
      this.selectedForStand.push(event.target.src);
      event.target.style.border = '3px solid #2c84fc';
    } else {
      let index = this.selectedForStand.indexOf(event.target.src);
      this.selectedForStand.splice(index, 1);
      event.target.style.border = 'none';
    }
  }

  updatePhotoList(event) {
    let file = event.target.files[0];
    if (this.postingCrop) {
      this.postFormData.photos.push(file);
    } else if (this.showingGarden) {
      return this.photosToStand.push(file);
    }
  }
}
