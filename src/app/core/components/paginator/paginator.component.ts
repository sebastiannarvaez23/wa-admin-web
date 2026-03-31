import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'wa-paginator',
    templateUrl: './paginator.component.html',
    styleUrls: ['./paginator.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginatorComponent {

    @Input() total      = 0;
    @Input() totalPages = 0;
    @Input() currentPage = 1;

    @Output() pageChange = new EventEmitter<number>();

    onPageChange(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.pageChange.emit(page);
    }
}
