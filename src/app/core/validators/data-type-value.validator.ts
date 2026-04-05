import { AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';

const BOOL_VALID = new Set(['true', 'false', '1', '0', 'yes', 'no']);

/**
 * Validates that a string value is compatible with the selected data type.
 *
 * @param dataTypeFn  Function that returns the current data type (STRING | INT | DECIMAL | BOOL | JSON).
 *                    Using a function allows reactive re-evaluation when the data type changes.
 *
 * Usage:
 *   value: ['', [Validators.required, dataTypeValueValidator(() => this.paramForm?.get('data_type')?.value)]]
 */
export function dataTypeValueValidator(dataTypeFn: () => string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        if (!value && value !== '0') return null; // let `required` handle empty

        const dataType = (dataTypeFn() || 'STRING').toUpperCase();

        switch (dataType) {
            case 'STRING':
                return null;

            case 'INT':
                return /^-?\d+$/.test(value.trim()) ? null : { dataTypeValue: { dataType, expected: 'integer' } };

            case 'DECIMAL':
                return isFinite(Number(value.trim())) && value.trim() !== ''
                    ? null
                    : { dataTypeValue: { dataType, expected: 'decimal' } };

            case 'BOOL':
                return BOOL_VALID.has(value.trim().toLowerCase())
                    ? null
                    : { dataTypeValue: { dataType, expected: 'boolean' } };

            case 'JSON':
                try {
                    JSON.parse(value);
                    return null;
                } catch {
                    return { dataTypeValue: { dataType, expected: 'JSON' } };
                }

            default:
                return null;
        }
    };
}
