import { Routes } from '@angular/router';
import { HeaderComponent } from './pages/header/header.component';
import { MainComponent } from './pages/main/main.component';

export const routes: Routes = [

    {
        path:'header',
        component: HeaderComponent
    },
    {
        path:'',
        component: MainComponent
    }
];
