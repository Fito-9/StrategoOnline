import { Routes } from '@angular/router';
import { HeaderComponent } from './pages/header/header.component';
import { MainComponent } from './pages/main/main.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { FriendshipComponent } from './pages/friendship/friendship.component';
import { MatchMakingComponent } from './matchmaking/matchmaking.component';


export const routes: Routes = [

    {
        path:'header',
        component: HeaderComponent
    },
    {
        path:'',
        component: MainComponent
    },
    {
        path:'login',
        component: LoginComponent
    },
    {
        path:'register',
        component: RegisterComponent
    },
    {
        path: 'friendship',
        component: FriendshipComponent
    },
    {
        path: 'matchmaking',
        component: MatchMakingComponent
    }
];