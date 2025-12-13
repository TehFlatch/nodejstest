import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from '../../services/loading.service';

@Component({
    selector: 'app-loader',
    standalone: true,
    imports: [CommonModule, MatProgressSpinnerModule],
    templateUrl: './loader.component.html',
    styleUrl: './loader.component.css'
})
export class LoaderComponent {
    private loadingService = inject(LoadingService);
    protected isLoading = this.loadingService.isLoading;
}
