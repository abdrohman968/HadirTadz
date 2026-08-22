<?php
/**
 * HADIRTADZ DESIGN SYSTEM HELPERS (v1.2.0 — Phase 3: ds_icon_button)
 * Centralized UI components to ensure consistency across Admin, Guru, Siswa, and Auth.
 *
 * ESCAPING RULES:
 * - $label in ds_button: INTENTIONALLY not escaped (trusted internal HTML for icons).
 * - $message in ds_alert: INTENTIONALLY not escaped (trusted internal HTML for links).
 * - All other dynamic text: escaped with htmlspecialchars().
 * - Callers MUST NOT pass user-supplied data to $label/$message without escaping.
 *
 * ACCESSIBILITY RULES:
 * - All inputs have associated <label> via for/id.
 * - All interactive elements have visible focus ring.
 * - Modals support keyboard escape and aria-label.
 * - Alerts use aria-live for screen readers.
 * - Buttons support disabled and loading states.
 */

if (!function_exists('ds_button')) {
/**
 * Render standard button
 *
 * @param string $label Button text or trusted HTML (e.g. icon + text).
 * @param string $variant primary|secondary|outline|danger|ghost|light
 * @param string $type button|submit|reset (default: button)
 * @param array $attributes Extra HTML attributes. Special keys:
 *   - 'class': appended to base classes.
 *   - 'disabled': boolean, adds disabled attribute + opacity.
 *   - 'loading': boolean, adds aria-busy + spinner + disables.
 * @return string HTML button element
 */
function ds_button($label, $variant = 'primary', $type = 'button', $attributes = []) {
    $base_classes = "px-4 py-2 rounded-xl font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2";

    $variants = [
        'primary'   => "bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm focus:ring-emerald-500 shadow-emerald-900/10",
        'secondary' => "bg-slate-800 hover:bg-slate-900 text-white shadow-sm focus:ring-slate-500",
        'outline'   => "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 focus:ring-emerald-500",
        'danger'    => "bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500 shadow-rose-900/10",
        'ghost'     => "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400",
        'light'     => "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-300",
    ];

    $class = $variants[$variant] ?? $variants['primary'];

    $is_disabled = !empty($attributes['disabled']);
    $is_loading = !empty($attributes['loading']);
    unset($attributes['disabled'], $attributes['loading']);

    if ($is_disabled || $is_loading) {
        $class .= " opacity-50 cursor-not-allowed pointer-events-none";
    }

    if (isset($attributes['class'])) {
        $class .= " " . $attributes['class'];
        unset($attributes['class']);
    }

    $attr_str = "";
    foreach ($attributes as $k => $v) {
        $attr_str .= ' ' . htmlspecialchars($k) . '="' . htmlspecialchars($v) . '"';
    }

    if ($is_disabled) {
        $attr_str .= ' disabled';
    }

    $type_escaped = htmlspecialchars($type);

    if ($is_loading) {
        $spinner = '<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>';
        $label = $spinner . '<span>' . $label . '</span>';
        $attr_str .= ' aria-busy="true"';
    }

    return '<button type="' . $type_escaped . '" class="' . $base_classes . ' ' . $class . '"' . $attr_str . '>' . $label . '</button>';
}
}

if (!function_exists('ds_icon_button')) {
/**
 * Render a small icon-only button (for table row actions, card actions).
 *
 * @param string $icon FontAwesome icon class (e.g. 'fa-solid fa-pen-to-square') or HTML
 * @param string $variant neutral|primary|danger|success
 * @param string $type button|submit|reset
 * @param array $attributes Extra HTML attributes. Special keys:
 *   - 'class': appended to base classes
 *   - 'title': tooltip text (also used as accessible name fallback)
 *   - 'aria_label': explicit accessible name (overrides title)
 *   - 'onclick': JavaScript onclick handler
 *   - 'disabled': boolean
 * @return string HTML button element
 */
function ds_icon_button($icon, $variant = 'neutral', $type = 'button', $attributes = []) {
    $base_classes = "p-1.5 rounded-lg text-xs transition inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-1";

    $variants = [
        'neutral' => "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 focus:ring-slate-400",
        'primary' => "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-500",
        'danger'  => "bg-rose-50 text-rose-600 hover:bg-rose-100 focus:ring-rose-500",
        'success' => "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-500",
    ];

    $class = $variants[$variant] ?? $variants['neutral'];

    $is_disabled = !empty($attributes['disabled']);
    unset($attributes['disabled']);

    if ($is_disabled) {
        $class .= " opacity-50 cursor-not-allowed pointer-events-none";
    }

    $title = $attributes['title'] ?? '';
    $aria_label = $attributes['aria_label'] ?? $title;
    unset($attributes['title'], $attributes['aria_label']);

    if (isset($attributes['class'])) {
        $class .= " " . $attributes['class'];
        unset($attributes['class']);
    }

    $attr_str = "";
    foreach ($attributes as $k => $v) {
        $attr_str .= ' ' . htmlspecialchars($k) . '="' . htmlspecialchars($v) . '"';
    }

    if ($is_disabled) {
        $attr_str .= ' disabled';
    }

    $aria_attr = $aria_label ? ' aria-label="' . htmlspecialchars($aria_label) . '"' : '';
    $title_attr = $title ? ' title="' . htmlspecialchars($title) . '"' : '';

    $icon_html = strpos($icon, '<') === 0 ? $icon : '<i class="' . htmlspecialchars($icon) . '"></i>';

    return '<button type="' . htmlspecialchars($type) . '" class="' . $base_classes . ' ' . $class . '"' . $attr_str . $aria_attr . $title_attr . '>' . $icon_html . '</button>';
}
}

if (!function_exists('ds_input')) {
/**
 * Render standard input field with label
 *
 * @param string $name Input name attribute
 * @param string $label Visible label text (escaped in output)
 * @param string $type Input type (text, email, password, number, etc.)
 * @param string $value Pre-filled value (escaped in output)
 * @param array $attributes Extra HTML attributes. Special keys:
 *   - 'id': override default id (defaults to $name)
 *   - 'class': appended to base classes
 *   - 'required': boolean, shows red asterisk
 *   - 'error': string, error message shown below input + red border
 *   - 'help_text': string, help text shown below input
 *   - Any other key/value is rendered as HTML attribute (escaped)
 * @return string HTML input component
 */
function ds_input($name, $label = '', $type = 'text', $value = '', $attributes = []) {
    $id = $attributes['id'] ?? $name;
    $required = isset($attributes['required']) ? '<span class="text-rose-500">*</span>' : '';
    $error_msg = $attributes['error'] ?? '';
    $help_text = $attributes['help_text'] ?? '';
    unset($attributes['error'], $attributes['help_text']);

    $input_class = "w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all";

    if ($error_msg) {
        $input_class .= " border-rose-300 focus:ring-rose-500 focus:border-rose-500";
    } else {
        $input_class .= " border-slate-300";
    }

    if (isset($attributes['class'])) {
        $input_class .= " " . $attributes['class'];
        unset($attributes['class']);
    }

    $attr_str = "";
    foreach ($attributes as $k => $v) {
        if ($k === 'id') continue;
        $attr_str .= ' ' . htmlspecialchars($k) . '="' . htmlspecialchars($v) . '"';
    }

    $error_id = $error_msg ? $id . '-error' : '';
    $help_id = $help_text ? $id . '-help' : '';
    $aria_describedby = array_filter([$error_id, $help_id]);
    $aria_attr = $aria_describedby ? ' aria-describedby="' . htmlspecialchars(implode(' ', $aria_describedby)) . '"' : '';
    if ($error_msg) {
        $aria_attr .= ' aria-invalid="true"';
    }

    $html = '<div class="space-y-1.5">';
    if ($label) {
        $html .= '<label for="' . htmlspecialchars($id) . '" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">' . $label . ' ' . $required . '</label>';
    }
    $html .= '<input type="' . htmlspecialchars($type) . '" name="' . htmlspecialchars($name) . '" id="' . htmlspecialchars($id) . '" value="' . htmlspecialchars($value) . '" class="' . $input_class . '"' . $attr_str . $aria_attr . '>';

    if ($error_msg) {
        $html .= '<p id="' . htmlspecialchars($error_id) . '" class="text-xs text-rose-600 mt-1" role="alert">' . htmlspecialchars($error_msg) . '</p>';
    } elseif ($help_text) {
        $html .= '<p id="' . htmlspecialchars($help_id) . '" class="text-xs text-slate-400 mt-1">' . htmlspecialchars($help_text) . '</p>';
    }

    $html .= '</div>';

    return $html;
}
}

if (!function_exists('ds_textarea')) {
/**
 * Render standard textarea
 *
 * @param string $name Textarea name attribute
 * @param string $label Visible label text (escaped)
 * @param string $value Pre-filled value (escaped)
 * @param array $attributes Extra HTML attributes. Special keys:
 *   - 'id': override default id
 *   - 'class': appended to base classes
 *   - 'required': boolean, shows red asterisk
 *   - 'rows': int, default 3
 *   - 'maxlength': int, max character count (rendered as attribute)
 *   - 'error': string, error message
 *   - 'help_text': string, help text
 * @return string HTML textarea component
 */
function ds_textarea($name, $label = '', $value = '', $attributes = []) {
    $id = $attributes['id'] ?? $name;
    $required = isset($attributes['required']) ? '<span class="text-rose-500">*</span>' : '';
    $rows = $attributes['rows'] ?? 3;
    $maxlength = $attributes['maxlength'] ?? null;
    $error_msg = $attributes['error'] ?? '';
    $help_text = $attributes['help_text'] ?? '';
    unset($attributes['error'], $attributes['help_text'], $attributes['maxlength']);

    $input_class = "w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all";

    if ($error_msg) {
        $input_class .= " border-rose-300 focus:ring-rose-500 focus:border-rose-500";
    } else {
        $input_class .= " border-slate-300";
    }

    if (isset($attributes['class'])) {
        $input_class .= " " . $attributes['class'];
        unset($attributes['class']);
    }

    $attr_str = "";
    foreach ($attributes as $k => $v) {
        if ($k === 'id' || $k === 'rows') continue;
        $attr_str .= ' ' . htmlspecialchars($k) . '="' . htmlspecialchars($v) . '"';
    }
    if ($maxlength !== null) {
        $attr_str .= ' maxlength="' . (int)$maxlength . '"';
    }

    $error_id = $error_msg ? $id . '-error' : '';
    $help_id = $help_text ? $id . '-help' : '';
    $aria_describedby = array_filter([$error_id, $help_id]);
    $aria_attr = $aria_describedby ? ' aria-describedby="' . htmlspecialchars(implode(' ', $aria_describedby)) . '"' : '';
    if ($error_msg) {
        $aria_attr .= ' aria-invalid="true"';
    }

    $html = '<div class="space-y-1.5">';
    if ($label) {
        $html .= '<label for="' . htmlspecialchars($id) . '" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">' . $label . ' ' . $required . '</label>';
    }
    $html .= '<textarea name="' . htmlspecialchars($name) . '" id="' . htmlspecialchars($id) . '" rows="' . htmlspecialchars($rows) . '" class="' . $input_class . '"' . $attr_str . $aria_attr . '>' . htmlspecialchars($value) . '</textarea>';

    if ($error_msg) {
        $html .= '<p id="' . htmlspecialchars($error_id) . '" class="text-xs text-rose-600 mt-1" role="alert">' . htmlspecialchars($error_msg) . '</p>';
    } elseif ($help_text) {
        $html .= '<p id="' . htmlspecialchars($help_id) . '" class="text-xs text-slate-400 mt-1">' . htmlspecialchars($help_text) . '</p>';
    }

    $html .= '</div>';

    return $html;
}
}

if (!function_exists('ds_select')) {
/**
 * Render standard select field
 *
 * @param string $name Select name attribute
 * @param array $options Associative array [value => label]
 * @param string|int $selected Currently selected value (strict comparison)
 * @param string $label Visible label text (escaped)
 * @param array $attributes Extra HTML attributes. Special keys:
 *   - 'id': override default id
 *   - 'class': appended to base classes
 *   - 'required': boolean, shows red asterisk
 *   - 'placeholder': string, adds a disabled empty first option
 *   - 'error': string, error message
 *   - 'help_text': string, help text
 * @return string HTML select component
 */
function ds_select($name, $options = [], $selected = '', $label = '', $attributes = []) {
    $id = $attributes['id'] ?? $name;
    $required = isset($attributes['required']) ? '<span class="text-rose-500">*</span>' : '';
    $placeholder = $attributes['placeholder'] ?? null;
    $error_msg = $attributes['error'] ?? '';
    $help_text = $attributes['help_text'] ?? '';
    unset($attributes['placeholder'], $attributes['error'], $attributes['help_text']);

    $select_class = "w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10";

    if ($error_msg) {
        $select_class .= " border-rose-300 focus:ring-rose-500 focus:border-rose-500";
    } else {
        $select_class .= " border-slate-300";
    }

    if (isset($attributes['class'])) {
        $select_class .= " " . $attributes['class'];
        unset($attributes['class']);
    }

    $attr_str = "";
    foreach ($attributes as $k => $v) {
        if ($k === 'id') continue;
        $attr_str .= ' ' . htmlspecialchars($k) . '="' . htmlspecialchars($v) . '"';
    }

    $error_id = $error_msg ? $id . '-error' : '';
    $help_id = $help_text ? $id . '-help' : '';
    $aria_describedby = array_filter([$error_id, $help_id]);
    $aria_attr = $aria_describedby ? ' aria-describedby="' . htmlspecialchars(implode(' ', $aria_describedby)) . '"' : '';
    if ($error_msg) {
        $aria_attr .= ' aria-invalid="true"';
    }

    $html = '<div class="space-y-1.5">';
    if ($label) {
        $html .= '<label for="' . htmlspecialchars($id) . '" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">' . $label . ' ' . $required . '</label>';
    }
    $html .= '<select name="' . htmlspecialchars($name) . '" id="' . htmlspecialchars($id) . '" class="' . $select_class . '"' . $attr_str . $aria_attr . '>';

    if ($placeholder !== null) {
        $html .= '<option value="" disabled' . ($selected === '' ? ' selected' : '') . '>' . htmlspecialchars($placeholder) . '</option>';
    }

    foreach ($options as $val => $text) {
        $is_selected = ((string)$val === (string)$selected) ? ' selected' : '';
        $html .= '<option value="' . htmlspecialchars($val) . '"' . $is_selected . '>' . htmlspecialchars($text) . '</option>';
    }
    $html .= '</select>';

    if ($error_msg) {
        $html .= '<p id="' . htmlspecialchars($error_id) . '" class="text-xs text-rose-600 mt-1" role="alert">' . htmlspecialchars($error_msg) . '</p>';
    } elseif ($help_text) {
        $html .= '<p id="' . htmlspecialchars($help_id) . '" class="text-xs text-slate-400 mt-1">' . htmlspecialchars($help_text) . '</p>';
    }

    $html .= '</div>';

    return $html;
}
}

if (!function_exists('ds_badge')) {
/**
 * Render standard badge
 *
 * @param string $text Badge text (escaped in output)
 * @param string $variant success|warning|danger|info|neutral
 * @param string $icon Optional FontAwesome icon class (escaped)
 * @return string HTML badge span
 */
function ds_badge($text, $variant = 'neutral', $icon = '') {
    $variants = [
        'success' => "bg-emerald-50 text-emerald-700 border-emerald-100",
        'danger'  => "bg-rose-50 text-rose-700 border-rose-100",
        'warning' => "bg-amber-50 text-amber-700 border-amber-100",
        'info'    => "bg-blue-50 text-blue-700 border-blue-100",
        'neutral' => "bg-slate-100 text-slate-600 border-slate-200",
    ];

    $class = $variants[$variant] ?? $variants['neutral'];
    $icon_html = $icon ? '<i class="' . htmlspecialchars($icon) . ' mr-1"></i>' : '';

    return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ' . $class . '">' . $icon_html . $text . '</span>';
}
}

if (!function_exists('ds_card_start')) {
/**
 * Start a card container
 *
 * @param string $title Card header title (escaped)
 * @param string $icon Optional FontAwesome icon class (escaped)
 * @param array $attributes Extra HTML attributes (class appended)
 * @return string HTML opening tags for card
 */
function ds_card_start($title = '', $icon = '', $attributes = []) {
    $class = "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden";
    if (isset($attributes['class'])) {
        $class .= " " . $attributes['class'];
        unset($attributes['class']);
    }

    $attr_str = "";
    foreach ($attributes as $k => $v) {
        $attr_str .= ' ' . htmlspecialchars($k) . '="' . htmlspecialchars($v) . '"';
    }

    $html = '<div class="' . $class . '"' . $attr_str . '>';
    if ($title) {
        $icon_html = $icon ? '<i class="' . htmlspecialchars($icon) . ' text-emerald-600"></i>' : '';
        $html .= '<div class="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">';
        if ($icon_html) $html .= '<div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-sm">' . $icon_html . '</div>';
        $html .= '<h3 class="text-sm font-bold text-slate-800">' . $title . '</h3>';
        $html .= '</div>';
    }
    $html .= '<div class="p-6">';
    return $html;
}
}

if (!function_exists('ds_card_end')) {
/**
 * End a card container
 * @return string HTML closing tags for card
 */
function ds_card_end() {
    return '</div></div>';
}
}

if (!function_exists('ds_alert')) {
/**
 * Render an alert
 *
 * @param string $message Alert message. INTENTIONALLY not escaped (trusted HTML allowed for links).
 *   Callers MUST escape user input before passing.
 * @param string $variant success|danger|warning|info
 * @param string $icon Optional FontAwesome icon class (overrides default for variant)
 * @param bool $dismissible Whether to show a dismiss button (default: false)
 * @return string HTML alert with optional aria-live
 */
function ds_alert($message, $variant = 'info', $icon = '', $dismissible = false) {
    $variants = [
        'success' => ['bg' => 'bg-emerald-50', 'border' => 'border-emerald-200', 'text' => 'text-emerald-800', 'icon' => 'fa-circle-check'],
        'danger'  => ['bg' => 'bg-rose-50', 'border' => 'border-rose-200', 'text' => 'text-rose-800', 'icon' => 'fa-circle-exclamation'],
        'warning' => ['bg' => 'bg-amber-50', 'border' => 'border-amber-200', 'text' => 'text-amber-800', 'icon' => 'fa-triangle-exclamation'],
        'info'    => ['bg' => 'bg-blue-50', 'border' => 'border-blue-200', 'text' => 'text-blue-800', 'icon' => 'fa-circle-info'],
    ];

    $v = $variants[$variant] ?? $variants['info'];
    $i = $icon ?: $v['icon'];

    $dismiss_html = '';
    if ($dismissible) {
        $dismiss_html = '<button type="button" onclick="this.closest(\'[role=alert]\').remove()" class="ml-auto flex-shrink-0 text-current opacity-50 hover:opacity-100 transition" aria-label="Tutup"><i class="fa-solid fa-xmark text-sm"></i></button>';
    }

    return '
    <div role="alert" aria-live="polite" class="flex items-start gap-3 p-4 rounded-2xl border ' . $v['bg'] . ' ' . $v['border'] . ' ' . $v['text'] . '">
        <i class="fa-solid ' . $i . ' mt-0.5"></i>
        <div class="text-sm font-medium leading-relaxed flex-1">' . $message . '</div>
        ' . $dismiss_html . '
    </div>';
}
}

if (!function_exists('ds_modal_start')) {
/**
 * Modal Start
 *
 * Accessibility:
 * - aria-label on dialog
 * - Escape key closes modal
 * - Focus trap within modal
 * - Backdrop click closes modal
 * - Body scroll locked when open
 *
 * @param string $id Unique modal identifier
 * @param string $title Modal title (escaped)
 * @param string $size sm|md|lg|xl|2xl
 * @return string HTML opening tags for modal
 */
function ds_modal_start($id, $title, $size = 'md') {
    $sizes = [
        'sm' => 'max-w-sm',
        'md' => 'max-w-md',
        'lg' => 'max-w-xl',
        'xl' => 'max-w-2xl',
        '2xl' => 'max-w-4xl',
    ];
    $size_class = $sizes[$size] ?? $sizes['md'];
    $id_escaped = htmlspecialchars($id);

    return '
    <div id="' . $id_escaped . '" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="' . $title . '">
        <div class="bg-white rounded-3xl shadow-2xl w-full ' . $size_class . ' overflow-hidden transform transition-all duration-300 max-h-[90vh] flex flex-col">
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
                <h3 class="text-base font-bold text-slate-800">' . $title . '</h3>
                <button type="button" onclick="closeModal(\'' . $id_escaped . '\')" class="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 flex items-center justify-center transition shadow-sm" aria-label="Tutup">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="p-6 overflow-y-auto">';
}
}

if (!function_exists('ds_modal_end')) {
/**
 * Modal End
 *
 * @param string $footer_html Optional footer HTML content (trusted, not escaped)
 * @return string HTML closing tags for modal
 */
function ds_modal_end($footer_html = '') {
    $footer = $footer_html ? '<div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 flex-shrink-0">' . $footer_html . '</div>' : '';
    return '</div>' . $footer . '</div></div>';
}
}

if (!function_exists('ds_modal_js')) {
/**
 * Output the modal JS controller (call once per page, typically in footer).
 * Handles: Escape key, backdrop click, focus trap, body scroll lock.
 *
 * @return string HTML <script> block
 */
function ds_modal_js() {
    return <<<'MODAL_JS'
<script>
(function() {
    const openModals = new Set();

    window.openModal = function(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove('hidden');
        el.classList.add('flex');
        document.body.style.overflow = 'hidden';
        openModals.add(id);
        const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length) focusable[0].focus();
    };

    window.closeModal = function(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add('hidden');
        el.classList.remove('flex');
        openModals.delete(id);
        if (openModals.size === 0) document.body.style.overflow = '';
    };

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && openModals.size > 0) {
            const last = Array.from(openModals).pop();
            closeModal(last);
        }
    });

    document.addEventListener('click', function(e) {
        if (e.target.id && openModals.has(e.target.id)) {
            closeModal(e.target.id);
        }
    });
})();
</script>
MODAL_JS;
}
}
