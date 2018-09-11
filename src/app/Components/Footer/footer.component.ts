import { Component, OnInit} from '@angular/core';
import { SessionService } from '../../Services/session.service';
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  user
  constructor(private session: SessionService) {
    this.user = session.getSession();
   }
   ngOnInit(){
     console.log('this.user',this.user)
   }
}
