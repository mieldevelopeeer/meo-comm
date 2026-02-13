import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Communication({ auth, communications = [], offices = [], incharges = [] }) {
    const { errors: flashErrors, success } = usePage().props.flash || {};
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOfficeModalOpen, setIsOfficeModalOpen] = useState(false);
    const [isInchargeModalOpen, setIsInchargeModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorDetails, setErrorDetails] = useState(null);
    const [viewingCommunication, setViewingCommunication] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('success');
    const [formErrors, setFormErrors] = useState({});
    const [officesList, setOfficesList] = useState(offices);
    const [inchargesList, setInchargesList] = useState(incharges);
    const [newlyCreatedOfficeId, setNewlyCreatedOfficeId] = useState(null);
    const [newlyCreatedInchargeId, setNewlyCreatedInchargeId] = useState(null);
    const [charCount, setCharCount] = useState(0);
    const [viewMode, setViewMode] = useState(() => {
        // Initialize from localStorage or default to 'list'
        const saved = localStorage.getItem('communicationViewMode');
        return saved || 'list';
    });
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        type: 'request',
        particulars: '',
        proponent: '',
        offices_id: '',
        incharge_id: '',
        status: 'in-progress',
    });

    const officeForm = useForm({
        name: '',
        status: 'active',
    });

    const inchargeForm = useForm({
        firstname: '',
        lastname: '',
        middlename: '',
        suffix: '',
    });

    useEffect(() => {
        setCharCount(data.particulars.length);
    }, [data.particulars]);

    useEffect(() => {
        setOfficesList(offices);
        
        if (newlyCreatedOfficeId && offices.length > 0) {
            const newOffice = offices.find(o => o.id === newlyCreatedOfficeId);
            if (newOffice) {
                setData('offices_id', newOffice.id);
                setNewlyCreatedOfficeId(null);
            }
        }
    }, [offices]);

    useEffect(() => {
        setInchargesList(incharges);
        
        if (newlyCreatedInchargeId && incharges.length > 0) {
            const newIncharge = incharges.find(i => i.id === newlyCreatedInchargeId);
            if (newIncharge) {
                setData('incharge_id', newIncharge.id);
                setNewlyCreatedInchargeId(null);
            }
        }
    }, [incharges]);

    useEffect(() => {
        if (success) {
            setNotificationMessage(success);
            setNotificationType('success');
            setShowNotification(true);
            
            const timer = setTimeout(() => {
                setShowNotification(false);
            }, 5000);
            
            return () => clearTimeout(timer);
        }
        
        if (flashErrors && Object.keys(flashErrors).length > 0) {
            const errorMessages = Object.values(flashErrors).flat();
            const errorMessage = errorMessages.length > 0 ? errorMessages[0] : 'An error occurred';
            
            setNotificationMessage(errorMessage);
            setNotificationType('error');
            setShowNotification(true);
            
            setErrorDetails({
                title: 'Server Error',
                message: errorMessage,
                details: flashErrors
            });
            setIsErrorModalOpen(true);
            
            const timer = setTimeout(() => {
                setShowNotification(false);
            }, 7000);
            
            return () => clearTimeout(timer);
        }
    }, [success, flashErrors]);

    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            const errorMessages = Object.values(errors).flat();
            const errorMessage = errorMessages.length > 0 ? errorMessages[0] : 'Validation error occurred';
            
            setNotificationMessage(errorMessage);
            setNotificationType('error');
            setShowNotification(true);
            
            setErrorDetails({
                title: 'Validation Error',
                message: 'Please fix the following errors:',
                details: errors
            });
            setIsErrorModalOpen(true);
            
            const timer = setTimeout(() => {
                setShowNotification(false);
            }, 7000);
            
            return () => clearTimeout(timer);
        }
    }, [errors]);

    // Save viewMode to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('communicationViewMode', viewMode);
    }, [viewMode]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        setFormErrors({});
        
        let hasError = false;
        const validationErrors = {};
        
        if (!data.proponent?.trim()) {
            validationErrors.proponent = ['Proponent is required'];
            hasError = true;
        }
        
        if (!data.particulars?.trim()) {
            validationErrors.particulars = ['Particulars is required'];
            hasError = true;
        }
        
        if (!data.offices_id) {
            validationErrors.offices_id = ['Office is required'];
            hasError = true;
        }
        
        if (hasError) {
            setFormErrors(validationErrors);
            setErrorDetails({
                title: 'Validation Error',
                message: 'Please fix the following errors before submitting:',
                details: validationErrors
            });
            setIsErrorModalOpen(true);
            return;
        }

        if (editingId) {
            put(route('communications.update', editingId), {
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                },
                onError: (errors) => {
                    if (errors && Object.keys(errors).length > 0) {
                        setErrorDetails({
                            title: 'Update Failed',
                            message: 'Failed to update communication. Please check the errors below:',
                            details: errors
                        });
                        setIsErrorModalOpen(true);
                    }
                    setFormErrors(errors);
                }
            });
        } else {
            post(route('communications.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                },
                onError: (errors) => {
                    if (errors && Object.keys(errors).length > 0) {
                        setErrorDetails({
                            title: 'Creation Failed',
                            message: 'Failed to create communication. Please check the errors below:',
                            details: errors
                        });
                        setIsErrorModalOpen(true);
                    }
                    setFormErrors(errors);
                }
            });
        }
    };

    const handleCreateOffice = (e) => {
        e.preventDefault();
        
        if (!officeForm.data.name?.trim()) {
            setErrorDetails({
                title: 'Validation Error',
                message: 'Office name is required',
                details: { name: ['Office name is required'] }
            });
            setIsErrorModalOpen(true);
            return;
        }
        
        officeForm.post(route('offices.store'), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                setNotificationMessage('Office created successfully!');
                setNotificationType('success');
                setShowNotification(true);
                
                const updatedOffices = page.props.offices;
                if (updatedOffices && updatedOffices.length > 0) {
                    const lastOffice = updatedOffices[updatedOffices.length - 1];
                    setNewlyCreatedOfficeId(lastOffice.id);
                    setOfficesList(updatedOffices);
                    setData('offices_id', lastOffice.id);
                }
                
                setIsOfficeModalOpen(false);
                officeForm.reset();
                
                setTimeout(() => {
                    setShowNotification(false);
                }, 5000);
            },
            onError: (errors) => {
                let errorMessage = 'Failed to create office.';
                if (errors && Object.keys(errors).length > 0) {
                    const firstError = Object.values(errors)[0];
                    errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                }
                
                setErrorDetails({
                    title: 'Office Creation Failed',
                    message: errorMessage,
                    details: errors
                });
                setIsErrorModalOpen(true);
            }
        });
    };

    const handleCreateIncharge = (e) => {
        e.preventDefault();
        
        if (!inchargeForm.data.firstname?.trim() || !inchargeForm.data.lastname?.trim()) {
            setErrorDetails({
                title: 'Validation Error',
                message: 'First name and last name are required',
                details: {
                    firstname: inchargeForm.data.firstname?.trim() ? [] : ['First name is required'],
                    lastname: inchargeForm.data.lastname?.trim() ? [] : ['Last name is required']
                }
            });
            setIsErrorModalOpen(true);
            return;
        }
        
        inchargeForm.post(route('incharges.store'), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                setNotificationMessage('In-charge created successfully!');
                setNotificationType('success');
                setShowNotification(true);
                
                const updatedIncharges = page.props.incharges;
                if (updatedIncharges && updatedIncharges.length > 0) {
                    const lastIncharge = updatedIncharges[updatedIncharges.length - 1];
                    setNewlyCreatedInchargeId(lastIncharge.id);
                    setInchargesList(updatedIncharges);
                    setData('incharge_id', lastIncharge.id);
                }
                
                setIsInchargeModalOpen(false);
                inchargeForm.reset();
                
                setTimeout(() => {
                    setShowNotification(false);
                }, 5000);
            },
            onError: (errors) => {
                let errorMessage = 'Failed to create in-charge.';
                if (errors && Object.keys(errors).length > 0) {
                    const firstError = Object.values(errors)[0];
                    errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                }
                
                setErrorDetails({
                    title: 'In-charge Creation Failed',
                    message: errorMessage,
                    details: errors
                });
                setIsErrorModalOpen(true);
            }
        });
    };

    const openModal = (communication = null) => {
        if (communication) {
            setEditingId(communication.id);
            setData({
                type: communication.type || 'request',
                particulars: communication.particulars || '',
                proponent: communication.proponent || '',
                offices_id: communication.offices_id || '',
                incharge_id: communication.incharge_id || '',
                status: communication.status || 'in-progress',
            });
            setCharCount(communication.particulars?.length || 0);
        } else {
            setEditingId(null);
            reset();
            setCharCount(0);
        }
        setFormErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormErrors({});
        reset();
        setCharCount(0);
    };

    const openOfficeModal = () => {
        officeForm.reset();
        setIsOfficeModalOpen(true);
    };

    const closeOfficeModal = () => {
        setIsOfficeModalOpen(false);
        officeForm.reset();
    };

    const openInchargeModal = () => {
        inchargeForm.reset();
        setIsInchargeModalOpen(true);
    };

    const closeInchargeModal = () => {
        setIsInchargeModalOpen(false);
        inchargeForm.reset();
    };

    const openViewModal = (communication) => {
        setViewingCommunication(communication);
        setIsViewModalOpen(true);
    };

    const closeViewModal = () => {
        setIsViewModalOpen(false);
        setViewingCommunication(null);
    };

    const closeErrorModal = () => {
        setIsErrorModalOpen(false);
        setErrorDetails(null);
    };

    const handleOfficeChange = (e) => {
        const value = e.target.value;
        if (value === 'new') {
            openOfficeModal();
        } else {
            setData('offices_id', value);
        }
    };

    const handleInchargeChange = (e) => {
        const value = e.target.value;
        if (value === 'new') {
            openInchargeModal();
        } else {
            setData('incharge_id', value);
        }
    };

    const closeNotification = () => {
        setShowNotification(false);
    };

    const getInchargeName = (incharge) => {
        if (!incharge) return 'Not assigned';
        const parts = [incharge.firstname, incharge.middlename, incharge.lastname].filter(Boolean);
        const name = parts.join(' ');
        return incharge.suffix ? `${name}, ${incharge.suffix}` : name;
    };

    const filteredCommunications = communications.filter(comm => {
        const matchesSearch = 
            (comm.from?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (comm.particulars?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (comm.proponent?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (comm.office?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (getInchargeName(comm.incharge)?.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = filterStatus === 'all' || comm.status === filterStatus;
        const matchesType = filterType === 'all' || comm.type === filterType;
        
        return matchesSearch && matchesStatus && matchesType;
    });

    const totalPages = Math.ceil(filteredCommunications.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCommunications = filteredCommunications.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterType, itemsPerPage]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    const getStatusColor = (status) => {
        const colors = {
            'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
            'for-filing': 'bg-amber-50 text-amber-700 border-amber-200',
            'completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
        return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const getTypeColor = (type) => {
        const colors = {
            'request': 'bg-indigo-50 text-indigo-700 border-indigo-200',
            'letter': 'bg-purple-50 text-purple-700 border-purple-200',
            'other': 'bg-slate-50 text-slate-700 border-slate-200',
        };
        return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const renderErrorList = (errors) => {
        if (!errors || Object.keys(errors).length === 0) return null;
        
        return (
            <div className="mt-3">
                <ul className="space-y-2">
                    {Object.entries(errors).map(([field, messages]) => (
                        Array.isArray(messages) && messages.map((message, index) => (
                            <li key={`${field}-${index}`} className="text-sm text-red-600 flex items-start gap-2">
                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span><span className="font-medium capitalize">{field}:</span> {message}</span>
                            </li>
                        ))
                    ))}
                </ul>
            </div>
        );
    };

    const StatusStats = () => {
        const stats = {
            total: communications.length,
            'in-progress': communications.filter(c => c.status === 'in-progress').length,
            'for-filing': communications.filter(c => c.status === 'for-filing').length,
            'completed': communications.filter(c => c.status === 'completed').length,
        };

        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-all duration-200 group cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Today</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                        </div>
                        <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-4 hover:border-blue-300 transition-all duration-200 group cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">In Progress</p>
                            <p className="text-2xl font-semibold text-blue-600">{stats['in-progress']}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-4 hover:border-amber-300 transition-all duration-200 group cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">For Filing</p>
                            <p className="text-2xl font-semibold text-amber-600">{stats['for-filing']}</p>
                        </div>
                        <div className="w-10 h-10 bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-4 hover:border-emerald-300 transition-all duration-200 group cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Completed</p>
                            <p className="text-2xl font-semibold text-emerald-600">{stats['completed']}</p>
                        </div>
                        <div className="w-10 h-10 bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900">
                            Today's Communications
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {new Date().toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })} • Resets daily at midnight
                        </p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Communication
                    </button>
                </div>
            }
        >
            <Head title="Communications" />

            {/* Notification */}
            {showNotification && (
                <div className="fixed top-4 right-4 z-50 animate-slide-in">
                    <div className={`${
                        notificationType === 'success' 
                            ? 'bg-white border border-emerald-200' 
                            : 'bg-white border border-red-200'
                    } shadow-lg max-w-md p-4`}>
                        <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 ${
                                notificationType === 'success' ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                                {notificationType === 'success' ? (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{notificationMessage}</p>
                            </div>
                            <button 
                                onClick={closeNotification}
                                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Status Stats */}
                    <StatusStats />

                    {/* Filters */}
                    <div className="bg-white border border-gray-200 mb-4 p-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search today's communications..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm transition-all"
                                />
                            </div>
                            <div className="flex gap-3">
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                                >
                                    <option value="all">All Types</option>
                                    <option value="request">Request</option>
                                    <option value="letter">Letter</option>
                                    <option value="other">Other</option>
                                </select>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="for-filing">For Filing</option>
                                    <option value="completed">Completed</option>
                                </select>
                                <button
                                    onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                                    className="px-3 py-2 border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
                                    title={viewMode === 'list' ? 'Grid view' : 'List view'}
                                >
                                    {viewMode === 'list' ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                            <div>
                                Showing {startIndex + 1}–{Math.min(endIndex, filteredCommunications.length)} of {filteredCommunications.length}
                            </div>
                            <div className="flex items-center gap-2">
                                <span>Per page:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                    className="px-2 py-1 border border-gray-300 text-sm"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Messages List/Grid */}
                    {currentCommunications.length === 0 ? (
                        <div className="bg-white border border-gray-200">
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No communications found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
                                        ? 'Try adjusting your search or filters' 
                                        : 'Get started by creating a new communication'}
                                </p>
                            </div>
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="bg-white border border-gray-200 overflow-hidden">
                            <div className="divide-y divide-gray-100">
                                {currentCommunications.map((communication) => (
                                    <div 
                                        key={communication.id}
                                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                                        onClick={() => openViewModal(communication)}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                                                    {getInitials(communication.proponent)}
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-sm font-semibold text-gray-900">
                                                            {communication.proponent || 'Unknown'}
                                                        </h3>
                                                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium border ${getTypeColor(communication.type)}`}>
                                                            {communication.type || 'other'}
                                                        </span>
                                                    </div>
                                                    <time className="text-xs text-gray-500 flex-shrink-0">
                                                        {formatDateTime(communication.created_at)}
                                                    </time>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 mb-2 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                        {communication.office?.name || 'No office'}
                                                    </span>
                                                    <span>·</span>
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        {getInchargeName(communication.incharge)}
                                                    </span>
                                                    <span>·</span>
                                                    <span className={`inline-flex px-2 py-0.5 border text-xs ${getStatusColor(communication.status)}`}>
                                                        {communication.status}
                                                    </span>
                                                </div>
                                                
                                                <p className="text-sm text-gray-700 line-clamp-2">
                                                    {communication.particulars || 'No details provided'}
                                                </p>
                                            </div>

                                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openModal(communication);
                                                    }}
                                                    className="text-gray-400 hover:text-gray-900 p-1"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {currentCommunications.map((communication) => (
                                <div
                                    key={communication.id}
                                    className="bg-white border border-gray-200 hover:border-gray-300 transition-all cursor-pointer group"
                                    onClick={() => openViewModal(communication)}
                                >
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                                                {getInitials(communication.proponent)}
                                            </div>
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium border ${getTypeColor(communication.type)}`}>
                                                {communication.type}
                                            </span>
                                        </div>

                                        <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                            {communication.proponent || 'Unknown'}
                                        </h3>

                                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                            {communication.particulars || 'No details provided'}
                                        </p>

                                        <div className="space-y-1.5 mb-3 text-xs text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                                <span className="truncate">{communication.office?.name || 'No office'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span className="truncate">{getInchargeName(communication.incharge)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <span className={`inline-flex px-2 py-0.5 border text-xs ${getStatusColor(communication.status)}`}>
                                                {communication.status}
                                            </span>
                                            <time className="text-xs text-gray-500">
                                                {formatDateTime(communication.created_at)}
                                            </time>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {filteredCommunications.length > 0 && totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between bg-white border border-gray-200 p-4">
                            <div className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                
                                <div className="hidden sm:flex items-center gap-1">
                                    {getPageNumbers().map((page, index) => (
                                        page === '...' ? (
                                            <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-gray-500">
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                                                    currentPage === page
                                                        ? 'bg-gray-900 text-white'
                                                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    ))}
                                </div>
                                
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* View Modal */}
            {isViewModalOpen && viewingCommunication && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                    <div className="w-12 h-12 bg-gray-900 text-white flex items-center justify-center text-base font-medium flex-shrink-0">
                                        {getInitials(viewingCommunication.proponent)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            {viewingCommunication.proponent || 'Unknown'}
                                        </h3>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium border ${getTypeColor(viewingCommunication.type)}`}>
                                                {viewingCommunication.type || 'other'}
                                            </span>
                                            <span className={`inline-flex px-2 py-1 border text-xs ${getStatusColor(viewingCommunication.status)}`}>
                                                {viewingCommunication.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={closeViewModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Routed by (Office)</label>
                                    <p className="mt-1 text-sm text-gray-900"> 
                                        {viewingCommunication.office?.name || 'No office assigned'}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">In-charge</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {getInchargeName(viewingCommunication.incharge)}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date & Time</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {new Date(viewingCommunication.created_at).toLocaleString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Particulars</label>
                                    <div className="mt-2 p-4 bg-gray-50 border border-gray-200 max-h-96 overflow-y-auto">
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                            {viewingCommunication.particulars || 'No details provided'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 bg-gray-50">
                            <button
                                onClick={closeViewModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    closeViewModal();
                                    openModal(viewingCommunication);
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {isErrorModalOpen && errorDetails && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70] animate-fade-in">
                    <div className="bg-white max-w-md w-full max-h-[80vh] overflow-hidden shadow-xl">
                        <div className="bg-red-50 border-b border-red-200 px-6 py-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 text-red-600">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.954-.833-2.724 0L4.342 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-red-900">
                                        {errorDetails.title || 'Error'}
                                    </h3>
                                </div>
                                <button
                                    onClick={closeErrorModal}
                                    className="text-red-400 hover:text-red-600"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-900">
                                        {errorDetails.message}
                                    </p>
                                </div>

                                {errorDetails.details && Object.keys(errorDetails.details).length > 0 && (
                                    <div className="bg-red-50 border border-red-200 p-4">
                                        <h4 className="text-sm font-medium text-red-900 mb-2">Details:</h4>
                                        {renderErrorList(errorDetails.details)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-gray-200 px-6 py-4 flex justify-end bg-gray-50">
                            <button
                                type="button"
                                onClick={closeErrorModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Communication Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {editingId ? 'Edit Communication' : 'New Communication'}
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                                    required
                                >
                                    <option value="request">Request</option>
                                    <option value="letter">Letter</option>
                                    <option value="other">Other</option>
                                </select>
                                {(formErrors.type || errors.type) && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.type || errors.type}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Proponent <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.proponent}
                                    onChange={(e) => setData('proponent', e.target.value)}
                                    placeholder="Enter proponent name"
                                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                                    required
                                />
                                {(formErrors.proponent || errors.proponent) && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.proponent || errors.proponent}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Particulars <span className="text-red-500">*</span>
                                    <span className="ml-2 text-xs text-gray-500">
                                        ({charCount.toLocaleString()} characters)
                                    </span>
                                </label>
                                <textarea
                                    value={data.particulars}
                                    onChange={(e) => setData('particulars', e.target.value)}
                                    rows="6"
                                    placeholder="Enter detailed particulars..."
                                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm resize-y"
                                    required
                                    maxLength="65535"
                                />
                                {(formErrors.particulars || errors.particulars) && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.particulars || errors.particulars}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Office <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.offices_id}
                                    onChange={handleOfficeChange}
                                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                                    required
                                >
                                    <option value="">Select Office</option>
                                    {officesList.map((office) => (
                                        <option key={office.id} value={office.id}>
                                            {office.name}
                                        </option>
                                    ))}
                                    <option value="new">+ Add New Office</option>
                                </select>
                                {(formErrors.offices_id || errors.offices_id) && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.offices_id || errors.offices_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    In-charge
                                </label>
                                <select
                                    value={data.incharge_id}
                                    onChange={handleInchargeChange}
                                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                                >
                                    <option value="">Select In-charge (Optional)</option>
                                    {inchargesList.map((incharge) => (
                                        <option key={incharge.id} value={incharge.id}>
                                            {getInchargeName(incharge)}
                                        </option>
                                    ))}
                                    <option value="new">+ Add New In-charge</option>
                                </select>
                                {(formErrors.incharge_id || errors.incharge_id) && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.incharge_id || errors.incharge_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                                >
                                    <option value="in-progress">In Progress</option>
                                    <option value="for-filing">For Filing</option>
                                    <option value="completed">Completed</option>
                                </select>
                                {(formErrors.status || errors.status) && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.status || errors.status}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                                    disabled={processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {processing ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Office Modal */}
            {isOfficeModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60] animate-fade-in">
                    <div className="bg-white max-w-md w-full shadow-xl">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Add New Office
                                </h3>
                                <button
                                    onClick={closeOfficeModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleCreateOffice} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Office Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={officeForm.data.name}
                                    onChange={(e) => officeForm.setData('name', e.target.value)}
                                    placeholder="Enter office name"
                                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                                    required
                                    autoFocus
                                />
                                {officeForm.errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{officeForm.errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={officeForm.data.status}
                                    onChange={(e) => officeForm.setData('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                                    required
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                {officeForm.errors.status && (
                                    <p className="mt-1 text-sm text-red-600">{officeForm.errors.status}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeOfficeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                                    disabled={officeForm.processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={officeForm.processing}
                                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {officeForm.processing ? 'Creating...' : 'Create Office'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* In-charge Modal */}
            {isInchargeModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60] animate-fade-in">
                    <div className="bg-white max-w-md w-full shadow-xl">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Add New In-charge
                                </h3>
                                <button
                                    onClick={closeInchargeModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleCreateIncharge} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={inchargeForm.data.firstname}
                                    onChange={(e) => inchargeForm.setData('firstname', e.target.value)}
                                    placeholder="Enter first name"
                                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                                    required
                                    autoFocus
                                />
                                {inchargeForm.errors.firstname && (
                                    <p className="mt-1 text-sm text-red-600">{inchargeForm.errors.firstname}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Middle Name
                                </label>
                                <input
                                    type="text"
                                    value={inchargeForm.data.middlename}
                                    onChange={(e) => inchargeForm.setData('middlename', e.target.value)}
                                    placeholder="Enter middle name (optional)"
                                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                                />
                                {inchargeForm.errors.middlename && (
                                    <p className="mt-1 text-sm text-red-600">{inchargeForm.errors.middlename}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={inchargeForm.data.lastname}
                                    onChange={(e) => inchargeForm.setData('lastname', e.target.value)}
                                    placeholder="Enter last name"
                                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                                    required
                                />
                                {inchargeForm.errors.lastname && (
                                    <p className="mt-1 text-sm text-red-600">{inchargeForm.errors.lastname}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Suffix
                                </label>
                                <input
                                    type="text"
                                    value={inchargeForm.data.suffix}
                                    onChange={(e) => inchargeForm.setData('suffix', e.target.value)}
                                    placeholder="e.g., Jr., Sr., III (optional)"
                                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm"
                                />
                                {inchargeForm.errors.suffix && (
                                    <p className="mt-1 text-sm text-red-600">{inchargeForm.errors.suffix}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeInchargeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                                    disabled={inchargeForm.processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inchargeForm.processing}
                                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {inchargeForm.processing ? 'Creating...' : 'Create In-charge'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }

                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }

                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </AuthenticatedLayout>
    );
}